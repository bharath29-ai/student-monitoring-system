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
        holder.statusText.setText("Status: " + item.getStatus());
        holder.scoreText.setText("Score: " + item.getScore() + "%");
        holder.dateText.setText(item.getTimestamp() != null ? item.getTimestamp().toDate().toString() : "No Date");
    }

    @Override
    public int getItemCount() {
        return reports.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView statusText, scoreText, dateText;
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            statusText = itemView.findViewById(R.id.reportStatusText);
            scoreText = itemView.findViewById(R.id.reportScoreText);
            dateText = itemView.findViewById(R.id.reportDateText);
        }
    }
}
