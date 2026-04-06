import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
interface graficoData {
  data: string;
  score: number;
}
interface graficoComparativoProps {
  graficoDados: graficoData[];
}
export function GraficoComparativo({ graficoDados }: graficoComparativoProps) {
  return (
    <>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={graficoDados}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="4 4" opacity={0.3} />

          <XAxis dataKey="data" tick={{ fontSize: 12 }} tickMargin={10} />

          <YAxis tick={{ fontSize: 12 }} tickMargin={10} domain={[0, 140]} />

          <Tooltip
            cursor={{ strokeDasharray: "4 4" }}
            contentStyle={{
              background: "#111827",
              borderRadius: 10,
              border: "1px solid #374151",
              color: "#fff",
              padding: "10px 12px",
            }}
            labelStyle={{ color: "#fff", fontWeight: 600 }}
            formatter={(value) => [`${value} pontos`, "Score"]}
          />

          <Legend verticalAlign="top" height={36} />

          <Line
            type="monotone"
            dataKey="score"
            name="Somatório"
            stroke="#29f172"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
