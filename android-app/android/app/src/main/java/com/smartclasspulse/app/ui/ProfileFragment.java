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
import androidx.appcompat.app.AppCompatDelegate;
import androidx.fragment.app.Fragment;

import com.google.android.material.switchmaterial.SwitchMaterial;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.UserSession;

public class ProfileFragment extends Fragment {

    private TextView nameText, roleText, idText;
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
        
        return view;
    }
}
