package com.smartclasspulse.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Spinner;
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
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.smartclasspulse.app.models.ClassItem;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public class MonitorActivity extends AppCompatActivity {

    private static final int PERMISSION_CODE = 1001;
    private static final String[] REQUIRED_PERMISSIONS;
    static {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            REQUIRED_PERMISSIONS = new String[]{
                    Manifest.permission.CAMERA,
                    Manifest.permission.POST_NOTIFICATIONS
            };
        } else {
            REQUIRED_PERMISSIONS = new String[]{
                    Manifest.permission.CAMERA
            };
        }
    }

    private PreviewView previewView;
    private TextView statusText, scoreText, messageText, syncText;
    private ProgressBar attentionProgress;
    private MaterialCardView syncBadge;
    private Spinner classSpinner;
    private FirebaseFirestore db;
    private String studentId, studentName, profileTeacherId, profileTeacherName, lastStatus;
    private List<ClassItem> enrolledClasses = new ArrayList<>();
    private ArrayAdapter<String> spinnerAdapter;
    
    private long lastReportTime = 0;
    private long lastAlertTime = 0;
    private static final long REPORT_INTERVAL = 2000; // 2 seconds
    private static final long ALERT_COOLDOWN = 15000; // 15 seconds

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
        classSpinner = findViewById(R.id.classSpinner);
        
        fetchProfileTeacherId();
        setupClassSpinner();
        
        Button closeButton = findViewById(R.id.closeButton);
        closeButton.setOnClickListener(v -> finish());

        if (allPermissionsGranted()) {
            startCamera();
        } else {
            ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, PERMISSION_CODE);
        }
    }

    @Override
    protected void onDestroy() {
        // Stop background service
        Intent serviceIntent = new Intent(this, MonitorService.class);
        stopService(serviceIntent);
        super.onDestroy();
    }

    private void fetchProfileTeacherId() {
        if (studentId == null) return;
        db.collection("users").document(studentId).get()
                .addOnSuccessListener(documentSnapshot -> {
                    profileTeacherId = documentSnapshot.getString("teacherId");
                    if (profileTeacherId != null) {
                        db.collection("users").document(profileTeacherId).get()
                                .addOnSuccessListener(tDoc -> {
                                    profileTeacherName = tDoc.getString("name");
                                });
                    }
                });
    }

    private void setupClassSpinner() {
        spinnerAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, new ArrayList<>());
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        classSpinner.setAdapter(spinnerAdapter);

        if (studentId == null) return;

        db.collection("classes")
                .whereArrayContains("students", studentId)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    enrolledClasses.clear();
                    List<String> classNames = new ArrayList<>();
                    for (DocumentSnapshot doc : queryDocumentSnapshots) {
                        ClassItem item = doc.toObject(ClassItem.class);
                        if (item != null) {
                            item.setId(doc.getId());
                            enrolledClasses.add(item);
                            classNames.add(item.getName());
                        }
                    }
                    spinnerAdapter.clear();
                    spinnerAdapter.addAll(classNames);
                    spinnerAdapter.notifyDataSetChanged();
                    
                    if (classNames.isEmpty()) {
                        spinnerAdapter.add("No Enrolled Classes");
                    }
                });
    }

    private boolean allPermissionsGranted() {
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_CODE) {
            if (allPermissionsGranted()) {
                startCamera();
            } else {
                Toast.makeText(this, "Camera and Notification permissions required", Toast.LENGTH_LONG).show();
                finish();
            }
        }
    }

    private void startCamera() {
        if (!allPermissionsGranted()) {
            Toast.makeText(this, "Permissions not granted", Toast.LENGTH_SHORT).show();
            return;
        }

        // Start background service
        try {
            Intent serviceIntent = new Intent(this, MonitorService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
        } catch (Exception e) {
            Log.e("MonitorActivity", "Failed to start service", e);
        }

        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);

        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                bindPreview(cameraProvider);
            } catch (ExecutionException | InterruptedException e) {
                Log.e("MonitorActivity", "Camera initialization failed", e);
                Toast.makeText(this, "Camera error: " + e.getMessage(), Toast.LENGTH_LONG).show();
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
                    statusText.setTextColor(ContextCompat.getColor(this, R.color.sleepy));
                } else if ("Distracted".equalsIgnoreCase(status)) {
                    statusText.setTextColor(ContextCompat.getColor(this, R.color.distracted));
                } else {
                    statusText.setTextColor(ContextCompat.getColor(this, R.color.onSurface));
                }

                syncDataToFirestore(status, score, msg);
            });
        }));

        cameraProvider.unbindAll();
        cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalysis);
    }

    private void syncDataToFirestore(String status, int score, String msg) {
        long currentTime = System.currentTimeMillis();
        boolean statusChanged = lastStatus == null || !lastStatus.equals(status);
        
        // Trigger report if status changed (Instant) OR interval passed
        if (statusChanged || (currentTime - lastReportTime > REPORT_INTERVAL)) {
            sendReport(status, score, msg);
            lastReportTime = currentTime;
            lastStatus = status;
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

        // Add class and teacher info if available
        int selectedPos = classSpinner.getSelectedItemPosition();
        if (selectedPos >= 0 && selectedPos < enrolledClasses.size()) {
            ClassItem selectedClass = enrolledClasses.get(selectedPos);
            data.put("classId", selectedClass.getId());
            data.put("className", selectedClass.getName());
            data.put("teacherId", selectedClass.getTeacherId());
            data.put("teacherName", selectedClass.getTeacherName());
        } else {
            data.put("classId", "general");
            data.put("className", "General Session");
            data.put("teacherId", profileTeacherId != null ? profileTeacherId : "unknown");
            data.put("teacherName", profileTeacherName != null ? profileTeacherName : "Teacher");
        }

        return data;
    }
}
