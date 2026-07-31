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
        float rotY = face.getHeadEulerAngleY(); // Left/Right rotation
        float rotX = face.getHeadEulerAngleX(); // Up/Down rotation
        float rotZ = face.getHeadEulerAngleZ(); // Tilt

        String status = "Attentive";
        int score = 100;
        String message = "Student is focused";

        // 1. SLEEPY DETECTION (Improved threshold)
        if (leftEyeOpen < 0.25 && rightEyeOpen < 0.25) {
            status = "Sleepy";
            score = 20;
            message = "Eyes closed detected";
        }
        // 2. DISTRACTED DETECTION (Horizontal - Looking Away)
        else if (rotY > 28 || rotY < -28) {
            status = "Distracted";
            score = 40;
            message = "Looking away from screen";
        }
        // 3. DISTRACTED DETECTION (Vertical - Looking Down at Phone/Desk)
        else if (rotX < -15) {
            status = "Distracted";
            score = 50;
            message = "Looking down (Phone/Book)";
        }
        // 4. DISTRACTED DETECTION (Vertical - Looking Up/Daydreaming)
        else if (rotX > 15) {
            status = "Distracted";
            score = 55;
            message = "Looking up (Daydreaming)";
        }
        // 5. TILT DETECTION (Extreme head tilt)
        else if (rotZ > 30 || rotZ < -30) {
            status = "Distracted";
            score = 60;
            message = "Head tilted excessively";
        }

        listener.onFaceResult(status, score, message);
    }
}
