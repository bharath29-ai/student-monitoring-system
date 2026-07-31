package com.smartclasspulse.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.auth.FirebaseAuth;

public class LoginActivity extends AppCompatActivity {

    private FirebaseAuth mAuth;
    private EditText emailEdit, passwordEdit;
    private Button loginBtn;
    private UserSession session;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        mAuth = FirebaseAuth.getInstance();
        session = new UserSession(this);

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
                        // For simplicity, using email as name. In real app, fetch from Firestore.
                        session.startSession(userId, email.split("@")[0], "student");
                        startActivity(new Intent(LoginActivity.this, MainActivity.class));
                        finish();
                    })
                    .addOnFailureListener(e -> {
                        Toast.makeText(this, "Login failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    });
        });
    }
}
