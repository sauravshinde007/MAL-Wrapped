import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const EvolutionChart = ({ evolutionData, topGenre }) => {
    // Process Data: Extract the monthly count of the user's TOP genre
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Create datasets for the top 2 genres found in the data to compare
    const dataPoints = evolutionData.map(month => month[topGenre] || 0);

    const data = {
        labels,
        datasets: [
            {
                label: topGenre,
                data: dataPoints,
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.5)',
                tension: 0.4, // Smooth curves
                pointRadius: 4,
            }
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: 'white' } },
        },
        scales: {
            y: { ticks: { color: 'white' }, grid: { color: '#333' } },
            x: { ticks: { color: 'white' }, grid: { display: false } }
        }
    };

    return (
        <div className="slide chart-slide">
            <h2>Your Taste Evolution</h2>
            <p>Your obsession with <span style={{color: '#FFD700'}}>{topGenre}</span> over the year</p>
            <div className="chart-container">
                <Line data={data} options={options} />
            </div>
        </div>
    );
};

export default EvolutionChart;