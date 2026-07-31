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
import androidx.fragment.app.Fragment;

import com.smartclasspulse.app.R;
import com.smartclasspulse.app.UserSession;

public class ProfileFragment extends Fragment {

    private TextView nameText, roleText, idText;
    private Button logoutButton, adminPanelButton;
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
        
        session = new UserSession(getContext());
        
        nameText.setText(session.getUserName());
        roleText.setText(session.getUserRole());
        idText.setText("ID: " + session.getUserId());

        if ("admin".equals(session.getUserRole())) {
            adminPanelButton.setVisibility(View.VISIBLE);
            adminPanelButton.setOnClickListener(v -> {
                startActivity(new Intent(getActivity(), com.smartclasspulse.app.AdminActivity.class));
            });
        }
        
        logoutButton.setOnClickListener(v -> {
            session.clear();
            startActivity(new Intent(getActivity(), com.smartclasspulse.app.LoginActivity.class));
            getActivity().finish();
        });
        
        return view;
    }
}
