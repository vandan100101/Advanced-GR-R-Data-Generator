 document.addEventListener('DOMContentLoaded', function() {
            // UI Elements
            const darkModeToggle = document.getElementById('darkModeToggle');
            const advancedToggle = document.getElementById('advancedToggle');
            const advancedOptions = document.getElementById('advancedOptions');
            const generateBtn = document.getElementById('generateBtn');
            const randomizeBtn = document.getElementById('randomizeBtn');
            const copyBtn = document.getElementById('copyBtn');
            const exportCSV = document.getElementById('exportCSV');
            const exportExcel = document.getElementById('exportExcel');
            const exportJSON = document.getElementById('exportJSON');
            const resetBtn = document.getElementById('resetBtn');
            const templateBtns = document.querySelectorAll('.template-btn');
            const tableHeader = document.getElementById('tableHeader');
            const tableBody = document.getElementById('tableBody');
            const dataSummary = document.getElementById('dataSummary');
            const grrResults = document.getElementById('grrResults');
            const variationTable = document.getElementById('variationTable');
            
            // Chart elements
            let controlChart, histogramChart, runChart, variationChart;
            
            // Data storage
            let generatedData = [];
            let currentStats = {};
            let currentGRR = {};
            
            // Initialize tooltips
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
            
            // Dark mode toggle
            darkModeToggle.addEventListener('change', function() {
                if (this.checked) {
                    document.documentElement.setAttribute('data-bs-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-bs-theme');
                }
                updateCharts();
            });
            
            // Advanced options toggle
            advancedToggle.addEventListener('click', function() {
                advancedOptions.classList.toggle('d-none');
                this.classList.toggle('btn-secondary');
                this.classList.toggle('btn-outline-secondary');
            });
            
            // Template buttons
            templateBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    document.getElementById('rows').value = this.dataset.rows;
                    document.getElementById('columns').value = this.dataset.cols;
                    generateData();
                });
            });
            
            // Reset button
            resetBtn.addEventListener('click', function() {
                document.getElementById('targetValue').value = '5.00';
                document.getElementById('tolerance').value = '1.00';
                document.getElementById('rows').value = '10';
                document.getElementById('columns').value = '3';
                document.getElementById('decimalPlaces').value = '2';
                document.getElementById('repeatability').value = '30';
                document.getElementById('reproducibility').value = '20';
                document.getElementById('partVariation').value = '50';
                document.getElementById('distribution').value = 'normal';
                document.getElementById('toolWear').value = '0';
                document.getElementById('outlierPercent').value = '0';
                generateData();
            });
            
            // Generate data button
            generateBtn.addEventListener('click', generateData);
            
            // Randomize button
            randomizeBtn.addEventListener('click', function() {
                document.getElementById('repeatability').value = Math.floor(Math.random() * 50) + 10;
                document.getElementById('reproducibility').value = Math.floor(Math.random() * 40) + 5;
                document.getElementById('partVariation').value = Math.floor(Math.random() * 50) + 30;
                document.getElementById('toolWear').value = Math.floor(Math.random() * 30);
                document.getElementById('outlierPercent').value = Math.floor(Math.random() * 5);
                generateData();
            });
            
            // Copy button
            copyBtn.addEventListener('click', copyToClipboard);
            
            // Export buttons
            exportCSV.addEventListener('click', exportToCSV);
            exportExcel.addEventListener('click', exportToExcel);
            exportJSON.addEventListener('click', exportToJSON);
            
            // Initial data generation
            generateData();
            
            // Main data generation function
            function generateData() {
                const targetValue = parseFloat(document.getElementById('targetValue').value);
                const tolerance = parseFloat(document.getElementById('tolerance').value);
                const rows = parseInt(document.getElementById('rows').value);
                const columns = parseInt(document.getElementById('columns').value);
                const decimalPlaces = parseInt(document.getElementById('decimalPlaces').value);
                
                // Advanced parameters
                const repeatability = parseInt(document.getElementById('repeatability').value) / 100;
                const reproducibility = parseInt(document.getElementById('reproducibility').value) / 100;
                const partVariation = parseInt(document.getElementById('partVariation').value) / 100;
                const distribution = document.getElementById('distribution').value;
                const toolWear = parseInt(document.getElementById('toolWear').value) / 100;
                const outlierPercent = parseInt(document.getElementById('outlierPercent').value) / 100;
                
                const minValue = targetValue - tolerance;
                const maxValue = targetValue + tolerance;
                
                // Calculate variation components
                const evRange = tolerance * repeatability;
                const avRange = tolerance * reproducibility;
                const pvRange = tolerance * partVariation;
                
                // Generate part averages with part-to-part variation
                const partAverages = [];
                for (let i = 0; i < rows; i++) {
                    let partMean;
                    if (distribution === 'uniform') {
                        partMean = targetValue + (Math.random() * 2 - 1) * pvRange;
                    } else if (distribution === 'bimodal') {
                        // Bi-modal distribution - cluster around two values
                        const mode = Math.random() > 0.5 ? 1 : -1;
                        partMean = targetValue + mode * (0.3 * pvRange) + (Math.random() * 0.4 - 0.2) * pvRange;
                    } else {
                        // Normal distribution
                        partMean = targetValue + gaussianRandom() * pvRange * 0.5;
                    }
                    
                    // Apply tool wear effect
                    const wearEffect = toolWear * (i / rows) * tolerance;
                    partAverages.push(partMean + wearEffect);
                }
                
                // Generate the full data table
                generatedData = [];
                const allValues = [];
                
                // Build header row
                tableHeader.innerHTML = '<th>Part</th>';
                for (let c = 0; c < columns; c++) {
                    tableHeader.innerHTML += `<th>Trial ${c+1}</th>`;
                }
                tableHeader.innerHTML += '<th>Avg</th><th>Range</th>';
                
                // Build data rows
                tableBody.innerHTML = '';
                let rowAverages = [];
                let rowRanges = [];
                
                for (let r = 0; r < rows; r++) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td class="fw-bold">${r+1}</td>`;
                    
                    const rowValues = [];
                    for (let c = 0; c < columns; c++) {
                        // Base value with part variation
                        let value = partAverages[r];
                        
                        // Add repeatability variation (within part)
                        value += gaussianRandom() * evRange * 0.5;
                        
                        // Add reproducibility variation (between trials)
                        value += (Math.random() * 2 - 1) * avRange * 0.3;
                        
                        // Apply outliers
                        if (Math.random() < outlierPercent) {
                            value += (Math.random() > 0.5 ? 1 : -1) * tolerance * (0.3 + Math.random() * 0.3);
                        }
                        
                        // Clamp to tolerance limits
                        value = Math.min(maxValue, Math.max(minValue, value));
                        
                        // Store value
                        const roundedValue = value.toFixed(decimalPlaces);
                        rowValues.push(parseFloat(roundedValue));
                        allValues.push(parseFloat(roundedValue));
                        
                        // Add to table
                        row.innerHTML += `<td>${roundedValue}</td>`;
                    }
                    
                    // Calculate row average and range
                    const rowAvg = rowValues.reduce((a, b) => a + b, 0) / columns;
                    const rowMin = Math.min(...rowValues);
                    const rowMax = Math.max(...rowValues);
                    const rowRange = rowMax - rowMin;
                    
                    rowAverages.push(rowAvg);
                    rowRanges.push(rowRange);
                    
                    // Add to table
                    row.innerHTML += `<td class="fw-bold">${rowAvg.toFixed(decimalPlaces)}</td>`;
                    row.innerHTML += `<td class="text-danger">${rowRange.toFixed(decimalPlaces)}</td>`;
                    
                    tableBody.appendChild(row);
                    generatedData.push(rowValues);
                }
                
                // Calculate statistics
                calculateStatistics(allValues, rowAverages, rowRanges);
                
                // Perform GR&R analysis
                performGRRAnalysis(rowAverages, rowRanges);
                
                // Update visualizations
                updateCharts();
                
                // Show data summary
                showDataSummary();
            }
            
            // Helper function for normal distribution
            function gaussianRandom() {
                let u = 0, v = 0;
                while(u === 0) u = Math.random();
                while(v === 0) v = Math.random();
                return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            }
            
           function calculateStatistics(allValues, averages, ranges) {
    // Initialize default stats
    const defaultStats = {
        average: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        range: 0,
        avgRange: 0,
        partAvg: 0,
        partStdDev: 0
    };

    // Check for valid inputs
    if (!Array.isArray(allValues)) return defaultStats;
    if (!Array.isArray(averages)) return defaultStats;
    if (!Array.isArray(ranges)) return defaultStats;
    if (allValues.length === 0) return defaultStats;

    try {
        const sum = allValues.reduce((a, b) => a + b, 0);
        const avg = sum / allValues.length;
        
        const squareDiffs = allValues.map(val => Math.pow(val - avg, 2));
        const variance = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(variance);
        
        // Handle ranges if provided
        let avgRange = 0, maxRange = 0, minRange = 0;
        if (ranges.length > 0) {
            avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
            maxRange = Math.max(...ranges);
            minRange = Math.min(...ranges);
        }
        
        // Handle part averages if provided
        let partAvg = 0, partStdDev = 0;
        if (averages.length > 0) {
            partAvg = averages.reduce((a, b) => a + b, 0) / averages.length;
            const partSquareDiffs = averages.map(x => Math.pow(x - partAvg, 2));
            const partVariance = partSquareDiffs.reduce((a, b) => a + b, 0) / averages.length;
            partStdDev = Math.sqrt(partVariance);
        }
        
        return {
            average: avg,
            stdDev: stdDev,
            min: Math.min(...allValues),
            max: Math.max(...allValues),
            range: Math.max(...allValues) - Math.min(...allValues),
            avgRange: avgRange,
            partAvg: partAvg,
            partStdDev: partStdDev
        };
    } catch (error) {
        console.error("Error calculating statistics:", error);
        return defaultStats;
    }
}
            
            // Perform GR&R analysis
            function performGRRAnalysis(averages, ranges) {
                const k1 = 0.5908; // Constants for 3 trials
                const k2 = 0.5231;
                const k3 = 0.5908;
                
                // Calculate average range
                const R_bar = ranges.reduce((a, b) => a + b, 0) / ranges.length;
                
                // Equipment Variation (Repeatability)
                const EV = k1 * R_bar;
                
                // Appraiser Variation (Reproducibility)
                const partCount = averages.length;
                const X_diff = Math.max(...averages) - Math.min(...averages);
                const AV = Math.sqrt(Math.pow(k2 * X_diff, 2) - Math.pow(EV, 2) / (partCount * 3));
                
                // GR&R
                const GRR = Math.sqrt(Math.pow(EV, 2) + Math.pow(AV, 2));
                
                // Part Variation
                const PV = k3 * currentStats.partStdDev;
                
                // Total Variation
                const TV = Math.sqrt(Math.pow(GRR, 2) + Math.pow(PV, 2));
                
                // Percentages
                const evPercent = (EV / TV) * 100;
                const avPercent = (AV / TV) * 100;
                const grrPercent = (GRR / TV) * 100;
                const pvPercent = (PV / TV) * 100;
                
                // Number of distinct categories
                const NDC = 1.41 * (PV / GRR);
                
                currentGRR = {
                    EV: EV,
                    AV: AV,
                    GRR: GRR,
                    PV: PV,
                    TV: TV,
                    evPercent: evPercent,
                    avPercent: avPercent,
                    grrPercent: grrPercent,
                    pvPercent: pvPercent,
                    NDC: NDC
                };
            }
            
            // Show data summary
            function showDataSummary() {
                const target = parseFloat(document.getElementById('targetValue').value);
                const tol = parseFloat(document.getElementById('tolerance').value);
                
                let summaryHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <table class="table table-sm table-bordered">
                                <tr>
                                    <th>Target Value</th>
                                    <td>${target.toFixed(2)} ± ${tol.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <th>Overall Average</th>
                                    <td>${currentStats.average.toFixed(4)}</td>
                                </tr>
                                <tr>
                                    <th>Standard Deviation</th>
                                    <td>${currentStats.stdDev.toFixed(4)}</td>
                                </tr>
                                <tr>
                                    <th>Range (Min - Max)</th>
                                    <td>${currentStats.min.toFixed(4)} - ${currentStats.max.toFixed(4)}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <table class="table table-sm table-bordered">
                                <tr>
                                    <th>Part Average</th>
                                    <td>${currentStats.partAvg.toFixed(4)}</td>
                                </tr>
                                <tr>
                                    <th>Part Std Dev</th>
                                    <td>${currentStats.partStdDev.toFixed(4)}</td>
                                </tr>
                                <tr>
                                    <th>Average Range</th>
                                    <td>${currentStats.avgRange.toFixed(4)}</td>
                                </tr>
                                <tr>
                                    <th>Data Points</th>
                                    <td>${generatedData.length * generatedData[0].length}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                `;
                
                dataSummary.innerHTML = summaryHTML;
                
                // Update GRR results
                let grrHTML = `
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Component</th>
                                    <th>Variation</th>
                                    <th>% of Total</th>
                                    <th>Assessment</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Equipment Variation (EV)</td>
                                    <td>${currentGRR.EV.toFixed(4)}</td>
                                    <td>${currentGRR.evPercent.toFixed(2)}%</td>
                                    <td class="${getAssessmentClass(currentGRR.evPercent)}">${getAssessmentText(currentGRR.evPercent)}</td>
                                </tr>
                                <tr>
                                    <td>Appraiser Variation (AV)</td>
                                    <td>${currentGRR.AV.toFixed(4)}</td>
                                    <td>${currentGRR.avPercent.toFixed(2)}%</td>
                                    <td class="${getAssessmentClass(currentGRR.avPercent)}">${getAssessmentText(currentGRR.avPercent)}</td>
                                </tr>
                                <tr>
                                    <td>GR&R (EV + AV)</td>
                                    <td>${currentGRR.GRR.toFixed(4)}</td>
                                    <td>${currentGRR.grrPercent.toFixed(2)}%</td>
                                    <td class="${getAssessmentClass(currentGRR.grrPercent)}">${getAssessmentText(currentGRR.grrPercent)}</td>
                                </tr>
                                <tr>
                                    <td>Part Variation (PV)</td>
                                    <td>${currentGRR.PV.toFixed(4)}</td>
                                    <td>${currentGRR.pvPercent.toFixed(2)}%</td>
                                    <td></td>
                                </tr>
                                <tr>
                                    <td>Total Variation (TV)</td>
                                    <td>${currentGRR.TV.toFixed(4)}</td>
                                    <td>100%</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="alert ${currentGRR.NDC >= 5 ? 'alert-success' : 'alert-warning'} mt-3">
                        <strong>Number of Distinct Categories (NDC):</strong> ${currentGRR.NDC.toFixed(2)}
                        <br>${currentGRR.NDC >= 5 ? '✓ Acceptable (≥5)' : '⚠ Needs improvement (should be ≥5)'}
                    </div>
                `;
                
                grrResults.innerHTML = grrHTML;
                
                // Update variation table
                variationTable.innerHTML = `
                    <table class="table table-sm table-bordered">
                        <tr>
                            <th>%EV</th>
                            <td>${currentGRR.evPercent.toFixed(2)}%</td>
                            <td rowspan="3" class="text-center align-middle">
                                <strong>%GRR = ${currentGRR.grrPercent.toFixed(2)}%</strong>
                            </td>
                        </tr>
                        <tr>
                            <th>%AV</th>
                            <td>${currentGRR.avPercent.toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <th>%PV</th>
                            <td>${currentGRR.pvPercent.toFixed(2)}%</td>
                        </tr>
                    </table>
                `;
            }
            
            function getAssessmentClass(percent) {
                if (percent <= 10) return 'table-success';
                if (percent <= 30) return 'table-warning';
                return 'table-danger';
            }
            
            function getAssessmentText(percent) {
                if (percent <= 10) return 'Excellent';
                if (percent <= 30) return 'Marginal';
                return 'Unacceptable';
            }
            
            // Update all charts
            function updateCharts() {
                updateControlChart();
                updateHistogramChart();
                updateRunChart();
                updateVariationChart();
            }
            
            // Control chart
            function updateControlChart() {
                const ctx = document.getElementById('controlChart').getContext('2d');
                const target = parseFloat(document.getElementById('targetValue').value);
                const tol = parseFloat(document.getElementById('tolerance').value);
                
                const partAverages = generatedData.map(row => 
                    row.reduce((sum, val) => sum + val, 0) / row.length
                );
                
                if (controlChart) {
                    controlChart.destroy();
                }
                
                controlChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: Array.from({length: partAverages.length}, (_, i) => `Part ${i+1}`),
                        datasets: [{
                            label: 'Part Averages',
                            data: partAverages,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        }, {
                            label: 'Target',
                            data: Array(partAverages.length).fill(target),
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            pointRadius: 0
                        }, {
                            label: 'Upper Limit',
                            data: Array(partAverages.length).fill(target + tol),
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1,
                            pointRadius: 0
                        }, {
                            label: 'Lower Limit',
                            data: Array(partAverages.length).fill(target - tol),
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1,
                            pointRadius: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Part Averages Control Chart'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.dataset.label}: ${context.parsed.y.toFixed(3)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                min: target - tol * 1.5,
                                max: target + tol * 1.5
                            }
                        }
                    }
                });
            }
            
            // Histogram chart
            function updateHistogramChart() {
                const ctx = document.getElementById('histogramChart').getContext('2d');
                const allValues = generatedData.flat();
                const target = parseFloat(document.getElementById('targetValue').value);
                const tol = parseFloat(document.getElementById('tolerance').value);
                
                // Calculate histogram bins
                const binSize = tol / 5;
                const binCount = Math.ceil((tol * 2) / binSize) + 2;
                const bins = Array(binCount).fill(0);
                
                allValues.forEach(value => {
                    const binIndex = Math.min(
                        Math.max(
                            Math.floor((value - (target - tol - binSize)) / binSize),
                            0
                        ),
                        binCount - 1
                    );
                    bins[binIndex]++;
                });
                
                const binLabels = Array.from({length: binCount}, (_, i) => {
                    const binStart = (target - tol - binSize) + i * binSize;
                    return `${binStart.toFixed(2)}-${(binStart + binSize).toFixed(2)}`;
                });
                
                if (histogramChart) {
                    histogramChart.destroy();
                }
                
                histogramChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: binLabels,
                        datasets: [{
                            label: 'Frequency',
                            data: bins,
                            backgroundColor: 'rgba(54, 162, 235, 0.7)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Measurement Distribution'
                            },
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Frequency'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Measurement Value Bins'
                                }
                            }
                        }
                    }
                });
            }
            
            // Run chart
            function updateRunChart() {
                const ctx = document.getElementById('runChart').getContext('2d');
                const allValues = generatedData.flat();
                
                if (runChart) {
                    runChart.destroy();
                }
                
                runChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: Array.from({length: allValues.length}, (_, i) => i+1),
                        datasets: [{
                            label: 'Measurements',
                            data: allValues,
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.1)',
                            borderWidth: 1,
                            pointRadius: 2,
                            pointHoverRadius: 4
                        }, {
                            label: 'Average',
                            data: Array(allValues.length).fill(currentStats.average),
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            pointRadius: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Measurement Run Chart'
                            },
                            legend: {
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false
                            }
                        }
                    }
                });
            }
            
            // Variation chart
            function updateVariationChart() {
                const ctx = document.getElementById('variationChart').getContext('2d');
                
                if (variationChart) {
                    variationChart.destroy();
                }
                
                variationChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Equipment Variation (EV)', 'Appraiser Variation (AV)', 'Part Variation (PV)'],
                        datasets: [{
                            data: [currentGRR.evPercent, currentGRR.avPercent, currentGRR.pvPercent],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.7)',
                                'rgba(54, 162, 235, 0.7)',
                                'rgba(75, 192, 192, 0.7)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(75, 192, 192, 1)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Variation Components'
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        return `${label}: ${value.toFixed(2)}%`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            // Copy to clipboard
            function copyToClipboard() {
                const table = document.getElementById('dataTable');
                let textToCopy = '';
                
                // Get all rows
                const rows = table.querySelectorAll('tr');
                
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td, th');
                    let rowText = [];
                    
                    cells.forEach(cell => {
                        rowText.push(cell.textContent);
                    });
                    
                    textToCopy += rowText.join('\t') + '\n';
                });
                
                navigator.clipboard.writeText(textToCopy.trim()).then(() => {
                    showAlert('Data copied to clipboard!', 'success');
                });
            }
            
            // Export to CSV
            function exportToCSV() {
                const table = document.getElementById('dataTable');
                let csvContent = '';
                
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td, th');
                    let rowArray = [];
                    
                    cells.forEach(cell => {
                        rowArray.push(cell.textContent);
                    });
                    
                    csvContent += rowArray.join(',') + '\r\n';
                });
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                saveAs(blob, 'grr_data.csv');
            }
            
            // Export to Excel
            function exportToExcel() {
                const table = document.getElementById('dataTable');
                const workbook = XLSX.utils.table_to_book(table);
                XLSX.writeFile(workbook, 'grr_data.xlsx');
            }
            
            // Export to JSON
            function exportToJSON() {
                const jsonData = {
                    parameters: {
                        targetValue: parseFloat(document.getElementById('targetValue').value),
                        tolerance: parseFloat(document.getElementById('tolerance').value),
                        rows: parseInt(document.getElementById('rows').value),
                        columns: parseInt(document.getElementById('columns').value),
                        decimalPlaces: parseInt(document.getElementById('decimalPlaces').value),
                        repeatability: parseInt(document.getElementById('repeatability').value),
                        reproducibility: parseInt(document.getElementById('reproducibility').value),
                        partVariation: parseInt(document.getElementById('partVariation').value),
                        distribution: document.getElementById('distribution').value,
                        toolWear: parseInt(document.getElementById('toolWear').value),
                        outlierPercent: parseInt(document.getElementById('outlierPercent').value)
                    },
                    data: generatedData,
                    statistics: currentStats,
                    grrAnalysis: currentGRR
                };
                
                const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                saveAs(blob, 'grr_data.json');
            }
            
            // Helper function to save files
            function saveAs(blob, filename) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            // Show alert
            function showAlert(message, type) {
                const alert = document.createElement('div');
                alert.className = `alert alert-${type} alert-dismissible fade show position-fixed bottom-0 end-0 m-3`;
                alert.style.zIndex = '1060';
                alert.innerHTML = `
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
                
                document.body.appendChild(alert);
                
                setTimeout(() => {
                    alert.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(alert);
                    }, 150);
                }, 3000);
            }
        });
