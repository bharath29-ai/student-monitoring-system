package com.smartclasspulse.app;

import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.content.ContextCompat;

import com.google.common.util.concurrent.ListenableFuture;
import com.google.firebase.Timestamp;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public class MonitorActivity extends AppCompatActivity {

    private PreviewView previewView;
    private TextView statusText, scoreText, messageText;
    private FirebaseFirestore db;
    private String studentId, studentName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_monitor);

        db = FirebaseFirestore.getInstance();

        // Get student info from Intent (passed from Capacitor)
        studentId = getIntent().getStringExtra("studentId");
        studentName = getIntent().getStringExtra("studentName");

        previewView = findViewById(R.id.previewView);
        statusText = findViewById(R.id.statusText);
        scoreText = findViewById(R.id.scoreText);
        messageText = findViewById(R.id.messageText);
        Button closeButton = findViewById(R.id.closeButton);

        closeButton.setOnClickListener(v -> finish());

        startCamera();
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
                statusText.setText("Status: " + status);
                scoreText.setText("Attention Score: " + score + "%");
                messageText.setText(msg);

                if (score < 50) {
                    sendAlertToFirestore(status, score, msg);
                }
            });
        }));

        cameraProvider.unbindAll();
        cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalysis);
    }

    private void sendAlertToFirestore(String status, int score, String msg) {
        Map<String, Object> alert = new HashMap<>();
        alert.put("studentId", studentId != null ? studentId : "unknown");
        alert.put("studentName", studentName != null ? studentName : "Guest Student");
        alert.put("status", status);
        alert.put("score", score);
        alert.put("message", msg);
        alert.put("timestamp", Timestamp.now());

        db.collection("alerts")
                .add(alert)
                .addOnFailureListener(e -> Log.e("MonitorActivity", "Firestore alert failed", e));
    }
}
