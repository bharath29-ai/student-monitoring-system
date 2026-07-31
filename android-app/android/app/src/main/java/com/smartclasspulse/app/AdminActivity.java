package com.smartclasspulse.app;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import androidx.viewpager2.widget.ViewPager2;

import com.google.android.material.tabs.TabLayout;
import com.google.android.material.tabs.TabLayoutMediator;
import com.smartclasspulse.app.ui.AdminApprovalsFragment;
import com.smartclasspulse.app.ui.AdminClassesFragment;
import com.smartclasspulse.app.ui.StudentsFragment;

public class AdminActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin);

        Toolbar toolbar = findViewById(R.id.adminToolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        TabLayout tabLayout = findViewById(R.id.adminTabLayout);
        ViewPager2 viewPager = findViewById(R.id.adminViewPager);

        viewPager.setAdapter(new FragmentStateAdapter(this) {
            @NonNull
            @Override
            public Fragment createFragment(int position) {
                if (position == 1) return new AdminClassesFragment();
                if (position == 2) return new StudentsFragment();
                return new AdminApprovalsFragment();
            }

            @Override
            public int getItemCount() {
                return 3;
            }
        });

        new TabLayoutMediator(tabLayout, viewPager, (tab, position) -> {
            if (position == 0) tab.setText("Approvals");
            else if (position == 1) tab.setText("Classes");
            else tab.setText("Users");
        }).attach();
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }
}
