package com.smartclasspulse.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.android.material.card.MaterialCardView;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.firebase.Timestamp;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public class MonitorActivity extends AppCompatActivity {

    private static final int PERMISSION_CODE = 1001;
    private PreviewView previewView;
    private TextView statusText, scoreText, messageText, syncText;
    private ProgressBar attentionProgress;
    private MaterialCardView syncBadge;
    private FirebaseFirestore db;
    private String studentId, studentName;
    
    private long lastReportTime = 0;
    private long lastAlertTime = 0;
    private static final long REPORT_INTERVAL = 5000; // 5 seconds
    private static final long ALERT_COOLDOWN = 30000; // 30 seconds

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_monitor);

        db = FirebaseFirestore.getInstance();

        studentId = getIntent().getStringExtra("studentId");
        studentName = getIntent().getStringExtra("studentName");

        previewView = findViewById(R.id.previewView);
        statusText = findViewById(R.id.statusText);
        scoreText = findViewById(R.id.scoreText);
        messageText = findViewById(R.id.messageText);
        syncText = findViewById(R.id.syncText);
        attentionProgress = findViewById(R.id.attentionProgress);
        syncBadge = findViewById(R.id.syncBadge);
        
        Button closeButton = findViewById(R.id.closeButton);
        closeButton.setOnClickListener(v -> finish());

        if (allPermissionsGranted()) {
            startCamera();
        } else {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, PERMISSION_CODE);
        }
    }

    private boolean allPermissionsGranted() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_CODE) {
            if (allPermissionsGranted()) {
                startCamera();
            } else {
                Toast.makeText(this, "Camera permission required for monitoring", Toast.LENGTH_LONG).show();
                finish();
            }
        }
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);

        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                bindPreview(cameraProvider);
            } catch (ExecutionException | InterruptedException e) {
                Log.e("MonitorActivity", "Camera initialization failed", e);
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void bindPreview(@NonNull ProcessCameraProvider cameraProvider) {
        Preview preview = new Preview.Builder().build();

        CameraSelector cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(CameraSelector.LENS_FACING_FRONT)
                .build();

        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        imageAnalysis.setAnalyzer(ContextCompat.getMainExecutor(this), new FaceAnalyzer((status, score, msg) -> {
            runOnUiThread(() -> {
                statusText.setText(status);
                scoreText.setText(score + "%");
                messageText.setText(msg);
                attentionProgress.setProgress(score);

                // Update Sync Status
                if ("No face detected".equalsIgnoreCase(msg)) {
                    syncText.setText("NO FACE");
                    syncBadge.setCardBackgroundColor(ContextCompat.getColor(this, android.R.color.holo_red_dark));
                } else {
                    syncText.setText("FACE SYNCED");
                    syncBadge.setCardBackgroundColor(ContextCompat.getColor(this, android.R.color.holo_green_dark));
                }

                // Update text colors based on status
                if ("Sleepy".equalsIgnoreCase(status)) {
                    statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_red_light));
                } else if ("Distracted".equalsIgnoreCase(status)) {
                    statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_orange_light));
                } else {
                    statusText.setTextColor(ContextCompat.getColor(this, android.R.color.white));
                }

                syncDataToFirestore(status, score, msg);
            });
        }));

        cameraProvider.unbindAll();
        cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalysis);
    }

    private void syncDataToFirestore(String status, int score, String msg) {
        long currentTime = System.currentTimeMillis();
        
        // Always send report at interval
        if (currentTime - lastReportTime > REPORT_INTERVAL) {
            sendReport(status, score, msg);
            lastReportTime = currentTime;
        }

        // Send alert if score is low AND cooldown passed
        if (score < 50 && (currentTime - lastAlertTime > ALERT_COOLDOWN)) {
            sendAlert(status, score, msg);
            lastAlertTime = currentTime;
        }
    }

    private void sendReport(String status, int score, String msg) {
        Map<String, Object> report = createBaseMap(status, score, msg);
        db.collection("reports").add(report);
    }

    private void sendAlert(String status, int score, String msg) {
        Map<String, Object> alert = createBaseMap(status, score, msg);
        db.collection("alerts").add(alert);
    }

    private Map<String, Object> createBaseMap(String status, int score, String msg) {
        Map<String, Object> data = new HashMap<>();
        data.put("studentId", studentId != null ? studentId : "unknown");
        data.put("studentName", studentName != null ? studentName : "Guest Student");
        data.put("status", status);
        data.put("score", score);
        data.put("observations", msg);
        data.put("timestamp", Timestamp.now());
        return data;
    }
}
