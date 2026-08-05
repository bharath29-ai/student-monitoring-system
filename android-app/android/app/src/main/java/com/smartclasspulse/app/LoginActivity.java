package com.smartclasspulse.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;

import com.google.firebase.auth.FirebaseAuth;

public class LoginActivity extends AppCompatActivity {

    private FirebaseAuth mAuth;
    private EditText emailEdit, passwordEdit;
    private Button loginBtn;
    private UserSession session;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        session = new UserSession(this);
        // Apply Theme
        if (session.isDarkMode()) {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        } else {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        }

        setContentView(R.layout.activity_login);

        mAuth = FirebaseAuth.getInstance();

        emailEdit = findViewById(R.id.emailEditText);
        passwordEdit = findViewById(R.id.passwordEditText);
        loginBtn = findViewById(R.id.loginButton);
        TextView signupLink = findViewById(R.id.signupLink);

        signupLink.setOnClickListener(v -> {
            startActivity(new Intent(LoginActivity.this, SignupActivity.class));
        });

        loginBtn.setOnClickListener(v -> {
            String email = emailEdit.getText().toString().trim();
            String password = passwordEdit.getText().toString().trim();

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
                return;
            }

            mAuth.signInWithEmailAndPassword(email, password)
                    .addOnSuccessListener(authResult -> {
                        String userId = authResult.getUser().getUid();
                        
                        // Fetch user profile from Firestore to get correct name and role
                        com.google.firebase.firestore.FirebaseFirestore.getInstance()
                                .collection("users")
                                .document(userId)
                                .get()
                                .addOnSuccessListener(documentSnapshot -> {
                                    if (!documentSnapshot.exists()) {
                                        mAuth.signOut();
                                        Toast.makeText(this, "Account not found or deleted.", Toast.LENGTH_LONG).show();
                                        return;
                                    }

                                    String status = documentSnapshot.getString("status");
                                    if ("pending".equals(status)) {
                                        mAuth.signOut();
                                        Toast.makeText(this, "Account pending approval.", Toast.LENGTH_LONG).show();
                                        return;
                                    } else if ("rejected".equals(status)) {
                                        mAuth.signOut();
                                        Toast.makeText(this, "Account rejected by admin.", Toast.LENGTH_LONG).show();
                                        return;
                                    }

                                    String name = documentSnapshot.getString("name");
                                    String role = documentSnapshot.getString("role");
                                    
                                    if (name == null) name = email.split("@")[0];
                                    if (role == null) role = "student";
                                    
                                    session.startSession(userId, name, role);
                                    startActivity(new Intent(LoginActivity.this, MainActivity.class));
                                    finish();
                                })
                                .addOnFailureListener(e -> {
                                    mAuth.signOut();
                                    Toast.makeText(this, "Login error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                                });
                    })
                    .addOnFailureListener(e -> {
                        Toast.makeText(this, "Login failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    });
        });
    }
}
