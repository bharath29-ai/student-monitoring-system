package com.smartclasspulse.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeMonitor")
public class NativeMonitorPlugin extends Plugin {

    @PluginMethod
    public void startMonitoring(PluginCall call) {
        String studentId = call.getString("studentId");
        String studentName = call.getString("studentName");

        Intent intent = new Intent(getContext(), MonitorActivity.class);
        intent.putExtra("studentId", studentId);
        intent.putExtra("studentName", studentName);
        
        getActivity().startActivity(intent);
        
        call.resolve();
    }
}
