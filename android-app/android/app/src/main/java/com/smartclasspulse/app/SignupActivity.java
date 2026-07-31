package com.smartclasspulse.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;

import java.util.HashMap;
import java.util.Map;

public class SignupActivity extends AppCompatActivity {

    private FirebaseAuth mAuth;
    private FirebaseFirestore db;
    private EditText nameEdit, emailEdit, passwordEdit;
    private RadioGroup roleGroup;
    private Button signupBtn;
    private TextView backToLogin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);

        mAuth = FirebaseAuth.getInstance();
        db = FirebaseFirestore.getInstance();

        nameEdit = findViewById(R.id.signupName);
        emailEdit = findViewById(R.id.signupEmail);
        passwordEdit = findViewById(R.id.signupPassword);
        roleGroup = findViewById(R.id.roleGroup);
        signupBtn = findViewById(R.id.signupButton);
        backToLogin = findViewById(R.id.backToLogin);

        signupBtn.setOnClickListener(v -> handleSignup());
        backToLogin.setOnClickListener(v -> finish());
    }

    private void handleSignup() {
        String name = nameEdit.getText().toString().trim();
        String email = emailEdit.getText().toString().trim();
        String password = passwordEdit.getText().toString().trim();
        
        String role = "student";
        int checkedId = roleGroup.getCheckedRadioButtonId();
        if (checkedId == R.id.radioTeacher) role = "teacher";
        else if (checkedId == R.id.radioAdmin) role = "admin";

        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        if (password.length() < 6) {
            Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show();
            return;
        }

        mAuth.createUserWithEmailAndPassword(email, password)
                .addOnSuccessListener(authResult -> {
                    String userId = authResult.getUser().getUid();
                    saveUserToFirestore(userId, name, email, role);
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(this, "Registration failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
    }

    private void saveUserToFirestore(String userId, String name, String email, String role) {
        Map<String, Object> user = new HashMap<>();
        user.put("uid", userId);
        user.put("name", name);
        user.put("email", email);
        user.put("role", role);
        user.put("status", "approved");
        user.put("createdAt", new java.util.Date().toString());

        db.collection("users").document(userId)
                .set(user)
                .addOnSuccessListener(aVoid -> {
                    Toast.makeText(this, "Account created! You can now login.", Toast.LENGTH_LONG).show();
                    finish();
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(this, "Firestore error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
    }
}
