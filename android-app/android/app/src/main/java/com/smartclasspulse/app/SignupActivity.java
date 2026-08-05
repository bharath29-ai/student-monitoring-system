package com.smartclasspulse.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.smartclasspulse.app.models.UserItem;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SignupActivity extends AppCompatActivity {

    private FirebaseAuth mAuth;
    private FirebaseFirestore db;
    private EditText nameEdit, emailEdit, passwordEdit;
    private RadioGroup roleGroup;
    private Spinner teacherSpinner;
    private Button signupBtn;
    private TextView backToLogin;
    private List<UserItem> teacherList = new ArrayList<>();
    private ArrayAdapter<String> spinnerAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        UserSession session = new UserSession(this);
        if (session.isDarkMode()) {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        } else {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        }

        setContentView(R.layout.activity_signup);

        mAuth = FirebaseAuth.getInstance();
        db = FirebaseFirestore.getInstance();

        nameEdit = findViewById(R.id.signupName);
        emailEdit = findViewById(R.id.signupEmail);
        passwordEdit = findViewById(R.id.signupPassword);
        roleGroup = findViewById(R.id.roleGroup);
        teacherSpinner = findViewById(R.id.teacherSpinner);
        signupBtn = findViewById(R.id.signupButton);
        backToLogin = findViewById(R.id.backToLogin);

        setupTeacherSpinner();

        roleGroup.setOnCheckedChangeListener((group, checkedId) -> {
            if (checkedId == R.id.radioStudent) {
                teacherSpinner.setVisibility(View.VISIBLE);
            } else {
                teacherSpinner.setVisibility(View.GONE);
            }
        });

        signupBtn.setOnClickListener(v -> handleSignup());
        backToLogin.setOnClickListener(v -> finish());
    }

    private void setupTeacherSpinner() {
        spinnerAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, new ArrayList<>());
        spinnerAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        teacherSpinner.setAdapter(spinnerAdapter);

        db.collection("users")
                .whereEqualTo("role", "teacher")
                .addSnapshotListener((queryDocumentSnapshots, error) -> {
                    if (error != null) {
                        Log.e("SignupActivity", "Firestore Listen Error", error);
                        Toast.makeText(this, "Error: " + error.getMessage(), Toast.LENGTH_LONG).show();
                        return;
                    }
                    if (queryDocumentSnapshots != null) {
                        Log.d("SignupActivity", "Found " + queryDocumentSnapshots.size() + " teachers");
                        teacherList.clear();
                        List<String> names = new ArrayList<>();
                        for (DocumentSnapshot doc : queryDocumentSnapshots) {
                            UserItem teacher = doc.toObject(UserItem.class);
                            if (teacher != null) {
                                teacher.setId(doc.getId());
                                teacherList.add(teacher);
                                String displayName = doc.getString("name");
                                if (displayName == null || displayName.isEmpty()) {
                                    displayName = doc.getString("email");
                                }
                                names.add(displayName != null ? displayName : "ID: " + doc.getId());
                            }
                        }
                        spinnerAdapter.clear();
                        spinnerAdapter.addAll(names);
                        spinnerAdapter.notifyDataSetChanged();
                    }
                });
    }

    private void handleSignup() {
        final String name = nameEdit.getText().toString().trim();
        final String email = emailEdit.getText().toString().trim();
        String password = passwordEdit.getText().toString().trim();
        
        final String role;
        int checkedId = roleGroup.getCheckedRadioButtonId();
        if (checkedId == R.id.radioTeacher) role = "teacher";
        else if (checkedId == R.id.radioAdmin) role = "admin";
        else role = "student";

        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show();
            return;
        }

        if (role.equals("student") && teacherSpinner.getSelectedItem() == null) {
            Toast.makeText(this, "Please select a teacher", Toast.LENGTH_SHORT).show();
            return;
        }

        if (password.length() < 6) {
            Toast.makeText(this, "Password must be at least 6 characters", Toast.LENGTH_SHORT).show();
            return;
        }

        mAuth.createUserWithEmailAndPassword(email, password)
                .addOnSuccessListener(authResult -> {
                    String userId = authResult.getUser().getUid();
                    
                    String teacherId = null;
                    if (role.equals("student")) {
                        int pos = teacherSpinner.getSelectedItemPosition();
                        if (pos >= 0 && pos < teacherList.size()) {
                            teacherId = teacherList.get(pos).getId();
                        }
                    }
                    
                    saveUserToFirestore(userId, name, email, role, teacherId);
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(this, "Registration failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
    }

    private void saveUserToFirestore(String userId, String name, String email, String role, String teacherId) {
        Map<String, Object> user = new HashMap<>();
        user.put("uid", userId);
        user.put("name", name);
        user.put("email", email);
        user.put("role", role);
        
        // Only set teacherId if it's a student and a teacher was selected
        if ("student".equals(role)) {
            user.put("teacherId", teacherId);
        } else {
            user.put("teacherId", null);
        }

        // Teachers and Admins need approval, students are approved by default
        if ("student".equals(role)) {
            user.put("status", "approved");
        } else {
            user.put("status", "pending");
        }
        user.put("createdAt", new java.util.Date().toString());

        db.collection("users").document(userId)
                .set(user)
                .addOnSuccessListener(aVoid -> {
                    Toast.makeText(this, "Account created! You can now login.", Toast.LENGTH_LONG).show();
                    // Clear fields to prevent "old details" showing up if navigating back or re-entering
                    nameEdit.setText("");
                    emailEdit.setText("");
                    passwordEdit.setText("");
                    finish();
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(this, "Firestore error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
    }
}
