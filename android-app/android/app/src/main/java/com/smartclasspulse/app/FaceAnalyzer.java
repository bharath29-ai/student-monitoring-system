package com.smartclasspulse.app;

import android.util.Log;
import androidx.annotation.NonNull;
import androidx.camera.core.ExperimentalGetImage;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.face.Face;
import com.google.mlkit.vision.face.FaceDetection;
import com.google.mlkit.vision.face.FaceDetector;
import com.google.mlkit.vision.face.FaceDetectorOptions;

import java.util.List;

@ExperimentalGetImage
public class FaceAnalyzer implements ImageAnalysis.Analyzer {

    private final FaceDetector detector;
    private final FaceResultListener listener;

    public interface FaceResultListener {
        void onFaceResult(String status, int score, String message);
    }

    public FaceAnalyzer(FaceResultListener listener) {
        this.listener = listener;
        FaceDetectorOptions options = new FaceDetectorOptions.Builder()
                .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
                .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                .build();
        this.detector = FaceDetection.getClient(options);
    }

    @Override
    public void analyze(@NonNull ImageProxy imageProxy) {
        if (imageProxy.getImage() == null) {
            imageProxy.close();
            return;
        }

        InputImage image = InputImage.fromMediaImage(
                imageProxy.getImage(),
                imageProxy.getImageInfo().getRotationDegrees()
        );

        detector.process(image)
                .addOnSuccessListener(faces -> {
                    if (faces.isEmpty()) {
                        listener.onFaceResult("Distracted", 0, "No face detected");
                    } else {
                        analyzeFace(faces.get(0));
                    }
                })
                .addOnFailureListener(e -> Log.e("FaceAnalyzer", "Detection failed", e))
                .addOnCompleteListener(task -> imageProxy.close());
    }

    private void analyzeFace(Face face) {
        float leftEyeOpen = face.getLeftEyeOpenProbability() != null ? face.getLeftEyeOpenProbability() : 1.0f;
        float rightEyeOpen = face.getRightEyeOpenProbability() != null ? face.getRightEyeOpenProbability() : 1.0f;
        float rotY = face.getHeadEulerAngleY(); // Rotation around vertical axis

        String status = "Attentive";
        int score = 100;
        String message = "Student is focused";

        // 1. SLEEPY DETECTION
        if (leftEyeOpen < 0.4 && rightEyeOpen < 0.4) {
            status = "Sleepy";
            score = 20;
            message = "Eyes closed detected";
        }
        // 2. DISTRACTED DETECTION
        else if (rotY > 25 || rotY < -25) {
            status = "Distracted";
            score = 45;
            message = "Looking away from screen";
        }

        listener.onFaceResult(status, score, message);
    }
}
