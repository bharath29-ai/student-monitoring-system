package com.smartclasspulse.app;

import android.content.Context;
import android.content.SharedPreferences;

public class UserSession {
    private static final String PREF_NAME = "SmartClassPulseSession";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_ROLE = "user_role";
    private static final String KEY_DARK_MODE = "dark_mode";

    private SharedPreferences prefs;

    public UserSession(Context context) {
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public void setDarkMode(boolean isDark) {
        prefs.edit().putBoolean(KEY_DARK_MODE, isDark).apply();
    }

    public boolean isDarkMode() {
        return prefs.getBoolean(KEY_DARK_MODE, false);
    }

    public void startSession(String userId, String name, String role) {
        prefs.edit()
             .putString(KEY_USER_ID, userId)
             .putString(KEY_USER_NAME, name)
             .putString(KEY_USER_ROLE, role)
             .apply();
    }

    public String getUserId() { return prefs.getString(KEY_USER_ID, null); }
    public String getUserName() { return prefs.getString(KEY_USER_NAME, "Guest"); }
    public String getUserRole() { return prefs.getString(KEY_USER_ROLE, "student"); }

    public void clear() {
        prefs.edit().clear().apply();
    }

    public boolean isLoggedIn() {
        return getUserId() != null;
    }
}
