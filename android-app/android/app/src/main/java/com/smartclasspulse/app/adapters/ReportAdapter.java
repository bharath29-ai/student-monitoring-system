package com.smartclasspulse.app.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.smartclasspulse.app.R;
import com.smartclasspulse.app.models.ReportItem;
import java.util.List;

public class ReportAdapter extends RecyclerView.Adapter<ReportAdapter.ViewHolder> {
    private List<ReportItem> reports;

    public ReportAdapter(List<ReportItem> reports) {
        this.reports = reports;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_report, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ReportItem item = reports.get(position);
        holder.nameText.setText(item.getStudentName() != null ? item.getStudentName() : "Student");
        holder.statusText.setText(item.getStatus());
        holder.scoreText.setText(item.getScore() + "%");
        holder.obsText.setText(item.getObservations());
        holder.dateText.setText(item.getTimestamp() != null ? item.getTimestamp().toDate().toString() : "");

        int color = 0xFF4CAF50;
        if ("distracted".equalsIgnoreCase(item.getStatus())) color = 0xFFFF9800;
        else if ("sleepy".equalsIgnoreCase(item.getStatus())) color = 0xFFF44336;
        holder.statusText.setTextColor(color);
    }

    @Override
    public int getItemCount() {
        return reports.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView nameText, statusText, scoreText, dateText, obsText;
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            nameText = itemView.findViewById(R.id.reportStudentName);
            statusText = itemView.findViewById(R.id.reportStatusText);
            scoreText = itemView.findViewById(R.id.reportScoreText);
            dateText = itemView.findViewById(R.id.reportDateText);
            obsText = itemView.findViewById(R.id.reportObservations);
        }
    }
}
