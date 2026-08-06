package com.smartclasspulse.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatDelegate;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;

import com.getcapacitor.BridgeActivity;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;
import com.smartclasspulse.app.ui.AlertsFragment;
import com.smartclasspulse.app.ui.ProfileFragment;
import com.smartclasspulse.app.ui.ReportsFragment;
import com.smartclasspulse.app.ui.StudentsFragment;

public class MainActivity extends BridgeActivity {

    private UserSession session;
    private FirebaseAuth mAuth;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        session = new UserSession(this);
        mAuth = FirebaseAuth.getInstance();

        // Apply Theme
        if (session.isDarkMode()) {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        } else {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        }

        // Check if user is logged in locally AND in Firebase
        if (!session.isLoggedIn() || mAuth.getCurrentUser() == null) {
            forceLogout("Please login again.");
            return;
        }

        // Verify user still exists in Firestore and has correct role
        verifyUserStatus();

        setContentView(R.layout.activity_main);

        // Register Plugins
        registerPlugin(NativeMonitorPlugin.class);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        BottomNavigationView bottomNav = findViewById(R.id.bottom_navigation);
        
        // Dynamic Menu adjustment
        if (!"student".equals(session.getUserRole())) {
            if (bottomNav.getMenu().findItem(R.id.nav_monitor) != null) {
                bottomNav.getMenu().findItem(R.id.nav_monitor).setTitle("Class Monitor");
                bottomNav.getMenu().findItem(R.id.nav_monitor).setIcon(android.R.drawable.ic_menu_share);
            }
        }

        bottomNav.setOnItemSelectedListener(item -> {
            Fragment selectedFragment = null;
            int itemId = item.getItemId();
            
            if (itemId == R.id.nav_dashboard) {
                selectedFragment = new DashboardFragment();
            } else if (itemId == R.id.nav_monitor) {
                if ("student".equals(session.getUserRole())) {
                    // Open Native Camera Activity
                    Intent intent = new Intent(this, MonitorActivity.class);
                    intent.putExtra("studentId", session.getUserId());
                    intent.putExtra("studentName", session.getUserName());
                    startActivity(intent);
                    return true;
                } else {
                    selectedFragment = new StudentsFragment();
                }
            } else if (itemId == R.id.nav_reports) {
                selectedFragment = new ReportsFragment();
            } else if (itemId == R.id.nav_alerts) {
                selectedFragment = new AlertsFragment();
            } else if (itemId == R.id.nav_profile) {
                selectedFragment = new ProfileFragment();
            }

            if (selectedFragment != null) {
                getSupportFragmentManager().beginTransaction()
                        .replace(R.id.container, selectedFragment)
                        .commit();
            }
            return true;
        });

        // Set default fragment
        if (savedInstanceState == null) {
            getSupportFragmentManager().beginTransaction()
                    .replace(R.id.container, new DashboardFragment())
                    .commit();
        }
    }

    private void verifyUserStatus() {
        if (mAuth.getCurrentUser() == null) return;
        String uid = mAuth.getCurrentUser().getUid();
        FirebaseFirestore.getInstance().collection("users").document(uid).get()
                .addOnSuccessListener(documentSnapshot -> {
                    if (!documentSnapshot.exists()) {
                        forceLogout("Account no longer exists.");
                        return;
                    }

                    String role = documentSnapshot.getString("role");
                    String status = documentSnapshot.getString("status");

                    if ("pending".equals(status) || "rejected".equals(status)) {
                        forceLogout("Your account is " + status + ".");
                        return;
                    }

                    // Sync local session if role changed in Firestore
                    if (role != null && !role.equals(session.getUserRole())) {
                        session.startSession(uid, documentSnapshot.getString("name"), role);
                        recreate(); // Refresh UI to show correct menu items
                    }
                })
                .addOnFailureListener(e -> {
                    // If network error, we might want to allow offline use, but for security:
                    // Toast.makeText(this, "Could not verify account status", Toast.LENGTH_SHORT).show();
                });
    }

    private void forceLogout(String message) {
        if (message != null) {
            Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        }
        mAuth.signOut();
        session.clear();
        Intent intent = new Intent(this, LoginActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
