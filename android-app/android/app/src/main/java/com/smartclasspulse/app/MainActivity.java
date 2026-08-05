package com.smartclasspulse.app;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;

import com.getcapacitor.BridgeActivity;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.smartclasspulse.app.ui.AlertsFragment;
import com.smartclasspulse.app.ui.ProfileFragment;
import com.smartclasspulse.app.ui.ReportsFragment;
import com.smartclasspulse.app.ui.StudentsFragment;

public class MainActivity extends BridgeActivity {

    private UserSession session;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        session = new UserSession(this);

        // Apply Theme
        if (session.isDarkMode()) {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
        } else {
            AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
        }

        if (!session.isLoggedIn()) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        setContentView(R.layout.activity_main);
        
        // Register Plugins
        registerPlugin(NativeMonitorPlugin.class);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        BottomNavigationView bottomNav = findViewById(R.id.bottom_navigation);
        
        // Dynamic Menu adjustment
        if (!"student".equals(session.getUserRole())) {
            bottomNav.getMenu().findItem(R.id.nav_monitor).setTitle("Class Monitor");
            bottomNav.getMenu().findItem(R.id.nav_monitor).setIcon(android.R.drawable.ic_menu_share);
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
}
