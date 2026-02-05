document.addEventListener('DOMContentLoaded', () => {
    // === Sidebar Logic ===
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mainContent = document.querySelector('.main-content');

    // Desktop Collapse
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Mobile Open
    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target) && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });

    // === Theme Switcher ===
    const themeSwitch = document.getElementById('themeSwitch');
    const body = document.body;
    const themeIcon = themeSwitch.querySelector('i');

    // Check LocalStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        themeIcon.classList.replace('bx-moon', 'bx-sun');
    }

    themeSwitch.addEventListener('click', () => {
        const isDark = body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            body.removeAttribute('data-theme');
            themeIcon.classList.replace('bx-sun', 'bx-moon');
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('bx-moon', 'bx-sun');
            localStorage.setItem('theme', 'dark');
        }
    });

    // === Data Simulation (KPIs) ===
    // Starting values as requested
    let prevRevenue = 10000;
    let prevOrders = 100;
    let prevUsers = 700;
    let prevConversion = 2.5; // starting conversion percent

    // Cache KPI elements
    const kpiRevenueEl = document.getElementById('kpi-revenue');
    const kpiOrdersEl = document.getElementById('kpi-orders');
    const kpiUsersEl = document.getElementById('kpi-users');
    const kpiConversionEl = document.getElementById('kpi-conversion');

    const revenueTrendEl = document.querySelector('.card-icon.revenue').parentElement.querySelector('.trend');
    const ordersTrendEl = document.querySelector('.card-icon.orders').parentElement.querySelector('.trend');
    const usersTrendEl = document.querySelector('.card-icon.users').parentElement.querySelector('.trend');
    const conversionTrendEl = document.querySelector('.card-icon.conversion').parentElement.querySelector('.trend');

    // Set initial display
    kpiRevenueEl.innerText = `$${prevRevenue.toLocaleString()}`;
    kpiOrdersEl.innerText = prevOrders;
    kpiUsersEl.innerText = prevUsers;
    kpiConversionEl.innerText = `${prevConversion.toFixed(1)}%`;

    function setTrend(el, previous, current) {
        const change = previous === 0 ? 0 : ((current - previous) / previous) * 100;
        const abs = Math.abs(change).toFixed(1);
        el.classList.remove('up', 'down');
        if (change > 0.05) {
            el.classList.add('up');
            el.innerHTML = `<i class='bx bx-up-arrow-alt'></i> +${abs}%`;
        } else if (change < -0.05) {
            el.classList.add('down');
            el.innerHTML = `<i class='bx bx-down-arrow-alt'></i> -${abs}%`;
        } else {
            el.innerHTML = `<i class='bx bx-minus'></i> 0.0%`;
        }
    }

    function updateKPIs() {
        // Small random fluctuations around previous values
        const newRevenue = Math.max(0, prevRevenue + (Math.floor(Math.random() * 8001) - 4000)); // +/- 4000
        const newOrders = Math.max(0, prevOrders + (Math.floor(Math.random() * 41) - 20)); // +/- 20
        const newUsers = Math.max(0, prevUsers + (Math.floor(Math.random() * 101) - 50)); // +/- 50
        const newConversion = Math.max(0.1, +(prevConversion + (Math.random() * 1 - 0.5)).toFixed(1)); // +/-0.5

        // Update display values
        kpiRevenueEl.innerText = `$${newRevenue.toLocaleString()}`;
        kpiOrdersEl.innerText = newOrders;
        kpiUsersEl.innerText = newUsers;
        kpiConversionEl.innerText = `${newConversion.toFixed(1)}%`;

        // Update trends (percent change)
        setTrend(revenueTrendEl, prevRevenue, newRevenue);
        setTrend(ordersTrendEl, prevOrders, newOrders);
        setTrend(usersTrendEl, prevUsers, newUsers);
        setTrend(conversionTrendEl, prevConversion, newConversion);

        // Store for next tick
        prevRevenue = newRevenue;
        prevOrders = newOrders;
        prevUsers = newUsers;
        prevConversion = newConversion;
    }

    // Update every 5 seconds
    setInterval(updateKPIs, 5000);
    updateKPIs(); // Initial tick (will produce first percent-change)

    // === Chart Implementation (Vanilla Canvas) ===
    const canvas = document.getElementById('revenueChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const chartFilter = document.querySelector('.chart-filter');

        const chartData = {
            'Daily': {
                labels: ['9AM', '12PM', '3PM', '6PM', '9PM'],
                data: [500, 1200, 900, 1500, 2000]
            },
            'Weekly': {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                data: [12000, 19000, 3000, 5000, 2000, 30000, 45000]
            },
            'Monthly': {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                data: [45000, 52000, 48000, 61000]
            }
        };

        let currentLabels = chartData['Weekly'].labels;
        let currentData = chartData['Weekly'].data;

        // Resize canvas
        function resizeCanvas() {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            drawChart();
        }
        window.addEventListener('resize', resizeCanvas);

        // Filter Change Event
        chartFilter.addEventListener('change', (e) => {
            const selected = e.target.value;
            if (chartData[selected]) {
                currentLabels = chartData[selected].labels;
                currentData = chartData[selected].data;
                drawChart();
            }
        });

        function drawChart() {
            const width = canvas.width;
            const height = canvas.height;
            const padding = 40;
            const chartHeight = height - padding * 2;
            const chartWidth = width - padding * 2;

            ctx.clearRect(0, 0, width, height);

            // Draw Grid
            ctx.strokeStyle = getComputedStyle(body).getPropertyValue('--border-color') || '#ddd';
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.stroke();

            // Draw Bars
            const barWidth = chartWidth / currentData.length - 20;
            const maxVal = Math.max(...currentData);

            currentData.forEach((val, index) => {
                const barHeight = (val / maxVal) * chartHeight;
                const x = padding + 10 + index * (chartWidth / currentData.length);
                const y = height - padding - barHeight;

                // Bar color
                ctx.fillStyle = getComputedStyle(body).getPropertyValue('--primary-color') || '#6c5ce7';

                // Rounded top bar
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
                ctx.fill();

                // Labels
                ctx.fillStyle = getComputedStyle(body).getPropertyValue('--text-muted') || '#636e72';
                ctx.textAlign = 'center';
                ctx.fillText(currentLabels[index], x + barWidth / 2, height - padding + 20);
            });
        }

        // Delay initial draw to ensure styles are loaded
        setTimeout(resizeCanvas, 100);
    }

    // === Recent Orders Table & Filter ===
    const ordersData = [
        { id: '#1001', user: 'Mark Wilson', product: 'Nike Air Jordan', date: '2023-10-25', amount: 120.00, status: 'Completed' },
        { id: '#1002', user: 'Sarah Doe', product: 'PlayStation 5', date: '2023-10-26', amount: 499.00, status: 'Pending' },
        { id: '#1003', user: 'John Smith', product: 'iPhone 15 Case', date: '2023-10-27', amount: 25.00, status: 'Completed' },
        { id: '#1004', user: 'Emily Davis', product: 'Mechanical Keyboard', date: '2023-10-28', amount: 85.00, status: 'Cancelled' },
        { id: '#1005', user: 'Michael Brown', product: 'Monitor Stand', date: '2023-10-29', amount: 40.00, status: 'Completed' },
        { id: '#1006', user: 'Jessica Lee', product: 'USB-C Cable', date: '2023-10-30', amount: 12.00, status: 'Pending' }
    ];

    const tableBody = document.getElementById('ordersTableBody');
    const searchInput = document.getElementById('tableSearch');

    function renderTable(data) {
        tableBody.innerHTML = '';
        data.forEach(order => {
            const statusClass = `status-${order.status.toLowerCase()}`;
            const row = `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.user}</td>
                    <td>${order.product}</td>
                    <td>${order.date}</td>
                    <td>$${order.amount.toFixed(2)}</td>
                    <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    renderTable(ordersData);

    // Search Filter
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = ordersData.filter(item =>
            item.user.toLowerCase().includes(term) ||
            item.product.toLowerCase().includes(term) ||
            item.id.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });

    // Sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.getAttribute('data-sort');
            const isAsc = th.classList.contains('asc');

            // Reset all icons
            document.querySelectorAll('th i').forEach(i => i.className = 'bx bx-sort');

            // Toggle sort direction
            th.classList.toggle('asc');
            th.querySelector('i').className = isAsc ? 'bx bx-sort-down' : 'bx bx-sort-up';

            const sorted = [...ordersData].sort((a, b) => {
                if (typeof a[sortKey] === 'string') {
                    return isAsc ? b[sortKey].localeCompare(a[sortKey]) : a[sortKey].localeCompare(b[sortKey]);
                }
                return isAsc ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey];
            });

            renderTable(sorted);
        });
    });

    // === Activity List Population ===
    const activityData = [
        { msg: 'Order #1001 was placed', time: '5 min ago' },
        { msg: 'User Sarah Doe registered', time: '15 min ago' },
        { msg: 'Server maintenance completed', time: '1 hr ago' },
        { msg: 'New product added: iPhone 15', time: '2 hrs ago' },
        { msg: 'Weekly report generated', time: '5 hrs ago' }
    ];

    const activityList = document.getElementById('activityList');
    activityData.forEach(item => {
        const li = `
            <li class="activity-item">
                <div class="activity-icon">
                    <i class='bx bx-time-five'></i>
                </div>
                <div class="activity-details">
                    <p>${item.msg}</p>
                    <span>${item.time}</span>
                </div>
            </li>
        `;
        activityList.innerHTML += li;
    });

    // === Notif Dropdown ===
    const notificationEl = document.querySelector('.notification');
    const badgeEl = notificationEl.querySelector('.badge');

    const notifications = [
        'Printer Cartridge is out of stock',
        'Wireless Mouse is almost out of stock',
        'USB-C Cable is almost out of stock'
    ];

    function createDropdown() {
        let dropdown = notificationEl.querySelector('.notification-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'notification-dropdown';
            const listHtml = notifications.map(msg => `
                <div class="notification-item">
                    <div class="dot"></div>
                    <div class="notification-text">${msg}</div>
                </div>
            `).join('');
            dropdown.innerHTML = listHtml;
            notificationEl.appendChild(dropdown);
        }
        return dropdown;
    }

    function toggleNotifications(e) {
        e.stopPropagation();
        const dropdown = createDropdown();
        const isOpen = dropdown.classList.contains('open');
        // Close dropdown open first
        document.querySelectorAll('.notification-dropdown.open').forEach(d => d.classList.remove('open'));
        if (!isOpen) {
            dropdown.classList.add('open');
        }
    }

    notificationEl.addEventListener('click', toggleNotifications);

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = notificationEl.querySelector('.notification-dropdown');
        if (dropdown && dropdown.classList.contains('open')) {
            if (!notificationEl.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        }
    });
});
