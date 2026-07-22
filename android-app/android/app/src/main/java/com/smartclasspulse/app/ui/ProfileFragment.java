package com.smartclasspulse.app.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.smartclasspulse.app.R;
import com.smartclasspulse.app.UserSession;

public class ProfileFragment extends Fragment {

    private TextView nameText, roleText, idText;
    private Button logoutButton;
    private UserSession session;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_profile, container, false);
        
        nameText = view.findViewById(R.id.profileName);
        roleText = view.findViewById(R.id.profileRole);
        idText = view.findViewById(R.id.profileId);
        logoutButton = view.findViewById(R.id.logoutButton);
        
        session = new UserSession(getContext());
        
        nameText.setText(session.getUserName());
        roleText.setText(session.getUserRole());
        idText.setText("ID: " + session.getUserId());
        
        logoutButton.setOnClickListener(v -> {
            session.clear();
            getActivity().finish();
        });
        
        return view;
    }
}
