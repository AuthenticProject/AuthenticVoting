import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import type { CandidateResult } from '../../types/election';

interface VoteDistributionChartProps {
  candidateResults: CandidateResult[];
}

export const VoteDistributionChart: React.FC<VoteDistributionChartProps> = ({
  candidateResults,
}) => {
  const chartData = candidateResults.map((item) => ({
    name: `No. 0${item.candidate.candidate_number} - ${item.candidate.name.split(',')[0]}`,
    fullName: item.candidate.name,
    candidateNumber: item.candidate.candidate_number,
    votes: item.voteCount,
    percentage: item.percentage,
    isTop: item.isWinner || item.isTied,
  }));

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis
            type="number"
            domain={[0, 'dataMax + 5']}
            tick={{ fontSize: 11, fill: '#64748B' }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#101D35', fontWeight: 600 }}
            axisLine={{ stroke: '#CBD5E1' }}
            tickLine={false}
            width={180}
          />
          <Tooltip
            cursor={{ fill: 'rgba(243, 245, 249, 0.7)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-navy-primary text-white p-3 rounded-xl shadow-xl border border-navy-light/40 text-xs leading-snug">
                    <p className="font-extrabold text-gold-light mb-1">
                      Kandidat 0{data.candidateNumber}
                    </p>
                    <p className="text-slate-200 font-semibold">{data.fullName}</p>
                    <div className="mt-2 pt-2 border-t border-navy-light/40 flex items-center justify-between gap-4">
                      <span>Perolehan:</span>
                      <span className="font-bold text-white">{data.votes} Suara ({data.percentage}%)</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="votes" radius={[0, 8, 8, 0]} barSize={26}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isTop ? '#C9A45C' : '#24344E'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
