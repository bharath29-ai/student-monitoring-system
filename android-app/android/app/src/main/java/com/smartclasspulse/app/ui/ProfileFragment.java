package com.smartclasspulse.app.ui;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.fragment.app.Fragment;

import com.google.android.material.switchmaterial.SwitchMaterial;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.FirebaseFirestore;
import com.smartclasspulse.app.LoginActivity;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.UserSession;

public class ProfileFragment extends Fragment {

    private TextView nameText, roleText, idText, deleteAccountBtn;
    private Button logoutButton, adminPanelButton;
    private SwitchMaterial themeSwitch;
    private UserSession session;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_profile, container, false);
        
        nameText = view.findViewById(R.id.profileName);
        roleText = view.findViewById(R.id.profileRole);
        idText = view.findViewById(R.id.profileId);
        logoutButton = view.findViewById(R.id.logoutButton);
        adminPanelButton = view.findViewById(R.id.adminPanelButton);
        themeSwitch = view.findViewById(R.id.themeSwitch);
        deleteAccountBtn = view.findViewById(R.id.deleteAccountBtn);
        
        session = new UserSession(getContext());
        
        nameText.setText(session.getUserName());
        roleText.setText(session.getUserRole());
        idText.setText("ID: " + session.getUserId());

        themeSwitch.setChecked(session.isDarkMode());
        themeSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            session.setDarkMode(isChecked);
            if (isChecked) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
            }
            if (getActivity() != null) {
                getActivity().recreate();
            }
        });

        if ("admin".equals(session.getUserRole())) {
            adminPanelButton.setVisibility(View.VISIBLE);
            adminPanelButton.setOnClickListener(v -> {
                startActivity(new Intent(getActivity(), com.smartclasspulse.app.AdminActivity.class));
            });
        }
        
        logoutButton.setOnClickListener(v -> {
            com.google.firebase.auth.FirebaseAuth.getInstance().signOut();
            session.clear();
            startActivity(new Intent(getActivity(), com.smartclasspulse.app.LoginActivity.class));
            getActivity().finish();
        });

        deleteAccountBtn.setOnClickListener(v -> showDeleteConfirmation());
        
        return view;
    }

    private void showDeleteConfirmation() {
        new AlertDialog.Builder(getContext())
                .setTitle("Delete Account?")
                .setMessage("This will permanently delete your login and all data. This cannot be undone.")
                .setPositiveButton("Delete Everything", (dialog, which) -> deleteAccount())
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void deleteAccount() {
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        if (user == null) return;

        String uid = user.getUid();
        FirebaseFirestore db = FirebaseFirestore.getInstance();

        // 1. Delete from Firestore
        db.collection("users").document(uid).delete()
                .addOnSuccessListener(aVoid -> {
                    // 2. Delete from Authentication
                    user.delete()
                            .addOnSuccessListener(aVoid2 -> {
                                Toast.makeText(getContext(), "Account deleted successfully", Toast.LENGTH_LONG).show();
                                session.clear();
                                startActivity(new Intent(getActivity(), LoginActivity.class));
                                getActivity().finish();
                            })
                            .addOnFailureListener(e -> {
                                // If account deletion fails (usually needs recent login), sign out anyway
                                FirebaseAuth.getInstance().signOut();
                                session.clear();
                                Toast.makeText(getContext(), "Auth deletion failed. Please re-login and try again.", Toast.LENGTH_LONG).show();
                                startActivity(new Intent(getActivity(), LoginActivity.class));
                                getActivity().finish();
                            });
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(getContext(), "Firestore deletion failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
    }
}
