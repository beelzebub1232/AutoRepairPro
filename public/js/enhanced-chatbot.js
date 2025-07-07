// Enhanced Chatbot with Database-Driven Responses
class EnhancedChatbot {
    constructor() {
        this.isOpen = false;
        this.isMinimized = false;
        this.conversationHistory = [];
        this.userContext = {
            role: sessionStorage.getItem('userRole'),
            userId: sessionStorage.getItem('userId'),
            userName: sessionStorage.getItem('userName')
        };
        this.bookingContext = null;
        this.paymentContext = null;
        this.jobDetailsContext = null;
        this.userManagementContext = null;
        this.init();
    }

    init() {
        this.createChatbotInterface();
        this.loadConversationHistory();
        this.attachEventListeners();
        this.addWelcomeMessage();
        this.startTypingAnimation();
    }

    createChatbotInterface() {
        // Remove existing chatbot if present
        const existingChatbot = document.getElementById('enhanced-chatbot-container');
        if (existingChatbot) {
            existingChatbot.remove();
        }

        const chatbotHTML = `
            <div id="enhanced-chatbot-container" class="enhanced-chatbot-container">
                <div id="enhanced-chatbot-toggle" class="enhanced-chatbot-toggle">
                    <div class="chatbot-icon">
                        <svg class="icon" viewBox="0 0 24 24" style="display: block; margin: 0 auto; transform: translateY(1px);">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <div class="chatbot-pulse"></div>
                </div>
                <div id="enhanced-chatbot-window" class="enhanced-chatbot-window">
                    <div class="chatbot-header">
                        <div class="chatbot-avatar">
                            <svg class="icon" viewBox="0 0 24 24">
                                <circle cx="12" cy="8" r="5"/>
                                <path d="M20 21a8 8 0 1 0-16 0"/>
                            </svg>
                        </div>
                        <div class="chatbot-info">
                            <h4>RepairHub Assistant</h4>
                            <span class="chatbot-status">Online</span>
                        </div>
                        <div class="chatbot-controls">
                            <button id="chatbot-minimize" class="chatbot-control-btn" title="Minimize">
                                <svg class="icon" viewBox="0 0 24 24">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                            </button>
                            <button id="chatbot-close" class="chatbot-control-btn" title="Close">
                                <svg class="icon" viewBox="0 0 24 24">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div id="enhanced-chatbot-messages" class="enhanced-chatbot-messages" role="log" aria-live="polite">
                        <!-- Messages will be inserted here -->
                    </div>
                    <div class="chatbot-typing-indicator" id="typing-indicator" style="display: none;">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span>Assistant is typing...</span>
                    </div>
                    <div class="enhanced-chatbot-input">
                        <div class="input-container">
                            <input type="text" id="chatbot-input-field" placeholder="Type your message..." autocomplete="off" aria-label="Chat message input" />
                            <button id="chatbot-send" class="send-button" aria-label="Send message">
                                <svg class="icon" viewBox="0 0 24 24">
                                    <line x1="22" y1="2" x2="11" y2="13"/>
                                    <polygon points="22,2 15,22 11,13 2,9"/>
                                </svg>
                            </button>
                        </div>
                        <div class="quick-suggestions" id="quick-suggestions">
                            <!-- Quick suggestions will be inserted here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    attachEventListeners() {
        const toggle = document.getElementById('enhanced-chatbot-toggle');
        const close = document.getElementById('chatbot-close');
        const minimize = document.getElementById('chatbot-minimize');
        const send = document.getElementById('chatbot-send');
        const input = document.getElementById('chatbot-input-field');

        toggle.addEventListener('click', () => this.toggleChatbot());
        close.addEventListener('click', () => this.closeChatbot());
        minimize.addEventListener('click', () => this.minimizeChatbot());
        send.addEventListener('click', () => this.sendMessage());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Keyboard navigation for quick suggestions
        document.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('quick-suggestion')) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleQuickSuggestion(e.target.textContent);
                }
            }
        });

        // Handle quick suggestions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-suggestion')) {
                this.handleQuickSuggestion(e.target.textContent);
            }
        });
    }

    toggleChatbot() {
        const window = document.getElementById('enhanced-chatbot-window');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            window.classList.add('active');
            this.updateQuickSuggestions();
            this.scrollToBottom();
            this.isMinimized = false;
        } else {
            window.classList.remove('active');
        }
    }

    closeChatbot() {
        const window = document.getElementById('enhanced-chatbot-window');
        window.classList.remove('active');
        this.isOpen = false;
        this.isMinimized = false;
    }

    minimizeChatbot() {
        const window = document.getElementById('enhanced-chatbot-window');
        this.isMinimized = !this.isMinimized;
        
        if (this.isMinimized) {
            window.classList.add('minimized');
        } else {
            window.classList.remove('minimized');
        }
    }

    addWelcomeMessage() {
        const welcomeMessage = this.getWelcomeMessage();
        this.addMessage(welcomeMessage.text, 'bot', welcomeMessage.suggestions);
    }

    getWelcomeMessage() {
        const role = this.userContext.role;
        const name = this.userContext.userName;
        
        const messages = {
            admin: {
                text: `Hello ${name}! I'm your RepairHub assistant. I can help you with managing operations, viewing reports, and system administration. How can I assist you today?`,
                suggestions: ['View Reports', 'Manage Inventory', 'Check Job Status', 'User Management']
            },
            employee: {
                text: `Hi ${name}! I'm here to help you with your assigned jobs, inventory management, and work-related queries. What do you need help with?`,
                suggestions: ['My Jobs', 'Update Job Status', 'Check Inventory', 'Report Issue']
            },
            customer: {
                text: `Welcome ${name}! I can help you book appointments, check your job status, and answer questions about our services. How may I help you?`,
                suggestions: ['Book Appointment', 'Check Job Status', 'View Services', 'Payment Help']
            }
        };

        return messages[role] || {
            text: "Hello! I'm your RepairHub assistant. How can I help you today?",
            suggestions: ['View Services', 'Contact Info', 'How to Book', 'Help']
        };
    }

    async sendMessage() {
        const input = document.getElementById('chatbot-input-field');
        const send = document.getElementById('chatbot-send');
        if (!input || !send) return;
        const message = input.value.trim();
        if (!message) return;
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        // Disable input and show loading
        input.disabled = true;
        send.disabled = true;
        const oldPlaceholder = input.placeholder;
        input.placeholder = 'Please wait...';
        this.showTypingIndicator();
        // Process message and get response
        setTimeout(async () => {
            let response;
            try {
                response = await this.processMessage(message);
            } catch {
                response = { text: 'Something went wrong. Please try again.', suggestions: ['Help'] };
            }
            this.addMessage(response.text, 'bot', response.suggestions);
            this.hideTypingIndicator();
            input.disabled = false;
            send.disabled = false;
            input.placeholder = oldPlaceholder;
            input.focus();
        }, 1000);
    }

    async processMessage(message) {
        const lowerMessage = message.toLowerCase();
        // Cancel/reset for any flow
        if (/cancel|exit|reset|stop/i.test(lowerMessage)) {
            this.bookingContext = null;
            this.paymentContext = null;
            this.jobDetailsContext = null;
            this.userManagementContext = null;
            return { text: 'Action cancelled. How else can I help you?', suggestions: ['Help', 'Main Menu'] };
        }
        // Multi-turn booking flow for customers
        if (this.bookingContext) {
            return await this.handleBookingFlow(message);
        }
        // Multi-turn payment flow for customers
        if (this.paymentContext) {
            return await this.handlePaymentFlow(message);
        }
        // Multi-turn job details flow
        if (this.jobDetailsContext) {
            return await this.handleJobDetailsFlow(message);
        }
        // Multi-turn user management flow
        if (this.userManagementContext) {
            return await this.handleUserManagementFlow(message);
        }
        // User management intents (admin only)
        if (this.userContext.role === 'admin' &&
            (/user management|manage users|view users|add user|deactivate user|remove user/i.test(message))) {
            this.userManagementContext = { step: 0, action: null, data: {} };
            return await this.handleUserManagementFlow(message);
        }
        // Job details intent
        if (/job details?\s*#?\d+/i.test(message)) {
            const match = message.match(/#?(\d+)/);
            if (match) {
                this.jobDetailsContext = { jobId: parseInt(match[1]), step: 0 };
                return await this.handleJobDetailsFlow();
            }
        }
        
        // Detect intent and get appropriate response
        if (this.detectIntent(lowerMessage, ['hello', 'hi', 'hey', 'good morning', 'good afternoon'])) {
            return this.getGreetingResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['book', 'appointment', 'schedule', 'service'])) {
            if (this.userContext.role === 'customer') {
                this.bookingContext = { step: 0, data: {} };
                return await this.handleBookingFlow();
            } else {
                return await this.getBookingResponse();
            }
        }
        
        if (this.detectIntent(lowerMessage, ['status', 'job', 'progress', 'update'])) {
            return await this.getStatusResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['service', 'services', 'what do you do', 'offer'])) {
            return await this.getServicesResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['price', 'cost', 'how much', 'pricing'])) {
            return await this.getPricingResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['pay', 'payment', 'invoice', 'bill'])) {
            if (this.userContext.role === 'customer') {
                this.paymentContext = { step: 0, data: {} };
                return await this.handlePaymentFlow();
            } else {
                return await this.getPaymentResponse();
            }
        }
        
        if (this.detectIntent(lowerMessage, ['inventory', 'parts', 'stock'])) {
            return await this.getInventoryResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['report', 'reports', 'analytics'])) {
            return await this.getReportsResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['location', 'where', 'address', 'branch'])) {
            return await this.getLocationResponse();
        }

        if (this.detectIntent(lowerMessage, ['hours', 'open', 'close', 'time'])) {
            return await this.getHoursResponse();
        }

        if (this.detectIntent(lowerMessage, ['contact', 'phone', 'email', 'call'])) {
            return await this.getContactResponse();
        }

        if (this.detectIntent(lowerMessage, ['help', 'support', 'assist'])) {
            return this.getHelpResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['user', 'employee', 'staff', 'manage'])) {
            return this.getUserManagementResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['job', 'work', 'assigned'])) {
            return await this.getEmployeeJobResponse();
        }
        
        return this.getDefaultResponse();
    }

    detectIntent(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }

    getGreetingResponse() {
        const responses = [
            "Hello! How can I help you today?",
            "Hi there! What can I assist you with?",
            "Welcome! How may I help you?",
            "Greetings! What would you like to know?"
        ];
        
        return {
            text: responses[Math.floor(Math.random() * responses.length)],
            suggestions: this.getContextualSuggestions()
        };
    }

    async getBookingResponse() {
        try {
            const response = await fetch('http://localhost:8080/api/admin/services');
            if (!response.ok) throw new Error('Failed to fetch services');
            
            const services = await response.json();
            const serviceList = services.slice(0, 5).map(service => 
                `${service.serviceName}: ₹${service.price}`
            ).join('\n• ');
            
                return {
                text: `I can help you book an appointment! Here are some of our popular services:\n\n• ${serviceList}\n\nTo book an appointment, please visit the "Book Appointment" section in your dashboard or contact us directly.`,
                suggestions: ['View All Services', 'Check Availability', 'Contact Support']
                };
        } catch (error) {
            return {
                text: "I can help you book an appointment! Please visit the 'Book Appointment' section in your dashboard or contact our support team for assistance.",
                suggestions: ['Contact Support', 'Check Dashboard', 'Help']
            };
        }
    }

    async getStatusResponse() {
        const role = this.userContext.role;
        const userId = this.userContext.userId;
        let jobs = [];
        try {
            if (role === 'customer') {
                const res = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
                jobs = await res.json();
            } else if (role === 'employee') {
                const res = await fetch(`http://localhost:8080/api/employee/jobs/${userId}`);
                jobs = await res.json();
            } else if (role === 'admin') {
                const res = await fetch('http://localhost:8080/api/admin/jobs');
                jobs = await res.json();
            }
        } catch {
            return {
                text: 'Unable to fetch job status at the moment. Please try again later.',
                suggestions: ['Help', 'Contact Support']
            };
        }
        if (!Array.isArray(jobs) || jobs.length === 0) {
            return {
                text: 'No jobs found for your account.',
                suggestions: ['Book Appointment', 'Help']
            };
        }
        // Show up to 5 jobs
        const jobList = jobs.slice(0, 5).map(job => {
            let line = `• ${job.status} - ${job.service || job.serviceName}`;
            if (job.vehicle) line += ` (${job.vehicle})`;
            if (job.bookingDate) line += ` on ${job.bookingDate.split('T')[0]}`;
            return line;
        }).join('\n');
        return {
            text: `Here are your recent jobs:\n\n${jobList}${jobs.length > 5 ? '\n...and more.' : ''}`,
            suggestions: ['View My Jobs', 'Job Details', 'Help']
        };
    }

    async getServicesResponse() {
        try {
            const response = await fetch('http://localhost:8080/api/admin/services');
            if (!response.ok) throw new Error('Failed to fetch services');
            
            const services = await response.json();
            const serviceList = services.map(service => 
                `${service.serviceName} (${service.category}) - ₹${service.price}`
            ).join('\n• ');
            
            return {
                text: `Here are our available services:\n\n• ${serviceList}\n\nEach service includes professional workmanship and quality parts. Contact us for detailed pricing and availability.`,
                suggestions: ['View Pricing', 'Book Service', 'Contact Support']
            };
        } catch (error) {
            return {
                text: "We offer a wide range of automotive services including body repair, paint jobs, maintenance, and more. Please contact us for specific service details and pricing.",
                suggestions: ['Contact Support', 'View Pricing', 'Book Service']
            };
        }
    }

    async getPricingResponse() {
            try {
            const response = await fetch('http://localhost:8080/api/admin/services');
            if (!response.ok) throw new Error('Failed to fetch services');
            
            const services = await response.json();
            const pricingList = services.slice(0, 6).map(service => 
                `${service.serviceName}: ₹${service.price}`
            ).join('\n• ');
                        
                        return {
                text: `Here are our current service prices:\n\n• ${pricingList}\n\nPrices may vary based on vehicle type and specific requirements. Contact us for a detailed quote.`,
                suggestions: ['Get Quote', 'Book Service', 'Contact Support']
                        };
            } catch (error) {
        return {
                text: "Our pricing varies based on the service and vehicle type. Please contact us for a detailed quote or visit our services page for general pricing information.",
                suggestions: ['Contact Support', 'Get Quote', 'View Services']
        };
        }
    }

    async getPaymentResponse() {
        if (this.userContext.role === 'customer') {
            return { text: 'To make a payment, please type "pay" or "pay invoice" and I will guide you through the process.', suggestions: ['Pay Invoice', 'Help'] };
        } else {
            return {
                text: 'For payment information, please contact our support team or visit the payments section in your dashboard.',
                suggestions: ['Contact Support', 'View Payments', 'Help']
            };
        }
    }
            
    async getInventoryResponse() {
        const role = this.userContext.role;
        if (role === 'admin' || role === 'employee') {
            try {
                let res;
                if (role === 'admin') {
                    res = await fetch('http://localhost:8080/api/admin/inventory');
                } else {
                    res = await fetch('http://localhost:8080/api/employee/inventory');
                }
                const inventory = await res.json();
                if (!Array.isArray(inventory) || inventory.length === 0) {
                    return { text: 'No inventory items found.', suggestions: ['Help', 'Add Item'] };
                }
                // Show up to 5 items, highlight low stock
                const itemList = inventory.slice(0, 5).map(item => {
                    let line = `• ${item.name || item.partName || item.itemName}: ${item.quantity} in stock`;
                    if (item.quantity !== undefined && item.minQuantity !== undefined && item.quantity <= item.minQuantity) {
                        line += ' (Low Stock!)';
                    }
                    return line;
                }).join('\n');
                return {
                    text: `Here is your inventory:\n\n${itemList}${inventory.length > 5 ? '\n...and more.' : ''}`,
                    suggestions: ['Check Stock', 'Add Item', 'Help']
                };
            } catch {
                return { text: 'Unable to fetch inventory at the moment. Please try again later.', suggestions: ['Help'] };
            }
        } else {
            return {
                text: 'For inventory and parts information, please contact our support team. They can help you with specific part availability and pricing.',
                suggestions: ['Contact Support', 'View Services', 'Help']
            };
        }
    }

    async getReportsResponse() {
        if (this.userContext.role === 'admin') {
            try {
                // Fetch different reports
                const revenueRes = await fetch('http://localhost:8080/api/admin/reports/revenue');
                const partUsageRes = await fetch('http://localhost:8080/api/admin/reports/part-usage');
                const empPerfRes = await fetch('http://localhost:8080/api/admin/reports/employee-performance');
                const custActRes = await fetch('http://localhost:8080/api/admin/reports/customer-activity');
                const revenue = await revenueRes.json();
                const partUsage = await partUsageRes.json();
                const empPerf = await empPerfRes.json();
                const custAct = await custActRes.json();
                // Build summary
                let text = 'Here are your latest reports:';
                if (revenue && revenue.totalRevenue !== undefined) text += `\n• Revenue: ₹${revenue.totalRevenue}`;
                if (Array.isArray(partUsage) && partUsage.length) text += `\n• Top Used Part: ${partUsage[0].partName || partUsage[0].name} (${partUsage[0].usageCount} times)`;
                if (Array.isArray(empPerf) && empPerf.length) text += `\n• Top Employee: ${empPerf[0].employeeName} (${empPerf[0].jobsCompleted} jobs)`;
                if (Array.isArray(custAct) && custAct.length) text += `\n• Most Active Customer: ${custAct[0].customerName} (${custAct[0].jobsCount} jobs)`;
                return {
                    text,
                    suggestions: ['Revenue Report', 'Part Usage', 'Employee Performance', 'Customer Activity', 'Export Data']
                };
            } catch {
                return { text: 'Unable to fetch reports at the moment. Please try again later.', suggestions: ['Help'] };
            }
        } else {
            return {
                text: 'Reports are available to administrators only. Please contact your administrator for access to reports and analytics.',
                suggestions: ['Contact Admin', 'Help', 'Support']
            };
        }
    }

    async getLocationResponse() {
        try {
            const response = await fetch('http://localhost:8080/api/customer/branches');
            if (!response.ok) throw new Error('Failed to fetch branches');
            
            const branches = await response.json();
            const branchList = branches.map(branch => 
                `${branch.name}: ${branch.address}`
            ).join('\n• ');
            
            return {
                text: `Here are our branch locations:\n\n• ${branchList}\n\nVisit any of our locations for service or contact us for directions.`,
                suggestions: ['Get Directions', 'Book Appointment', 'Contact Support']
            };
        } catch (error) {
        return {
                text: "We have multiple branch locations. Please contact our support team for the nearest location and directions.",
                suggestions: ['Contact Support', 'Book Appointment', 'Help']
            };
        }
    }

    async getHoursResponse() {
        try {
            const response = await fetch('http://localhost:8080/api/customer/branches');
            if (!response.ok) throw new Error('Failed to fetch branches');
            
            const branches = await response.json();
            const hoursList = branches.map(branch => 
                `${branch.name}: ${branch.hours || 'Contact for hours'}`
            ).join('\n• ');
            
            return {
                text: `Here are our business hours:\n\n• ${hoursList}\n\nHours may vary on holidays. Contact us for specific availability.`,
                suggestions: ['Book Appointment', 'Contact Support', 'View Locations']
        };
        } catch (error) {
        return {
                text: "Our business hours vary by location. Please contact our support team for specific hours at your nearest branch.",
                suggestions: ['Contact Support', 'Book Appointment', 'View Locations']
            };
        }
    }

    async getContactResponse() {
        try {
            const response = await fetch('http://localhost:8080/api/customer/branches');
            if (!response.ok) throw new Error('Failed to fetch branches');
            
            const branches = await response.json();
            const contactList = branches.map(branch => 
                `${branch.name}: ${branch.contact?.phone || 'Contact for phone'}`
            ).join('\n• ');
            
            return {
                text: `Here are our contact numbers:\n\n• ${contactList}\n\nYou can also email us at support@repairhub.com for assistance.`,
                suggestions: ['Book Appointment', 'Get Support', 'View Locations']
        };
        } catch (error) {
        return {
                text: "You can contact us by phone or email. Please call our main office or email support@repairhub.com for assistance.",
                suggestions: ['Book Appointment', 'Get Support', 'Help']
        };
        }
    }

    getHelpResponse() {
        return {
            text: "I'm here to help! You can ask me about:\n• Booking appointments\n• Checking job status\n• Service pricing\n• Branch locations\n• Business hours\n• Contact information\n\nWhat would you like to know?",
            suggestions: ['Book Appointment', 'Check Status', 'View Services', 'Contact Info']
        };
    }

    getUserManagementResponse() {
        if (this.userContext.role === 'admin') {
            return {
                text: "To manage users, please visit the 'Users' section in your admin dashboard. You can add, edit, and manage user accounts there.",
                suggestions: ['View Users', 'Add User', 'Manage Roles']
            };
        } else {
        return {
                text: "User management is available to administrators only. Please contact your administrator for user-related requests.",
                suggestions: ['Contact Admin', 'Help', 'Support']
        };
        }
    }

    async getEmployeeJobResponse() {
        if (this.userContext.role === 'employee') {
                        return {
                text: "To view your assigned jobs, please visit the 'Assigned Jobs' section in your dashboard. You can update job status and add notes there.",
                suggestions: ['View Jobs', 'Update Status', 'Add Notes']
                        };
                    } else {
                        return {
                text: "Job management is available to employees and administrators. Please contact your supervisor for job-related information.",
                suggestions: ['Contact Supervisor', 'Help', 'Support']
                        };
        }
    }

    getDefaultResponse() {
        const responses = [
            "I'm not sure I understand. Could you please rephrase that?",
            "I don't have information about that. Can I help you with something else?",
            "I'm still learning. Could you try asking about our services, appointments, or contact information?",
            "I'm not sure about that. Would you like to know about our services or how to book an appointment?"
        ];
        
        return {
            text: responses[Math.floor(Math.random() * responses.length)],
            suggestions: this.getContextualSuggestions()
        };
    }

    getContextualSuggestions() {
        const role = this.userContext.role;
        
        if (role === 'admin') {
            return ['View Reports', 'Manage Users', 'Check Inventory', 'System Settings'];
        } else if (role === 'employee') {
            return ['My Jobs', 'Update Status', 'Check Inventory', 'Report Issue'];
        } else {
            return ['Book Appointment', 'Check Status', 'View Services', 'Contact Support'];
        }
    }

    addMessage(text, sender, suggestions = []) {
        const messagesContainer = document.getElementById('enhanced-chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}-message fade-in`;
        messageDiv.setAttribute('tabindex', '0');
        messageDiv.setAttribute('role', 'status');
        messageDiv.setAttribute('aria-live', 'polite');
        const avatar = sender === 'bot' ? `
            <div class="message-avatar">
                <svg class="icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M20 21a8 8 0 1 0-16 0"/>
                </svg>
            </div>
        ` : '';
        const messageContent = `
            <div class="message-content">
                <div class="message-text">${text}</div>
            ${suggestions.length > 0 ? `
                <div class="message-suggestions">
                    ${suggestions.map((suggestion, idx) => 
                        `<button class="quick-suggestion" tabindex="0" aria-label="${suggestion}" data-idx="${idx}">${suggestion}</button>`
                    ).join('')}
                </div>
            ` : ''}
            </div>
        `;
        messageDiv.innerHTML = avatar + messageContent;
        messagesContainer.appendChild(messageDiv);
        // Animate fade-in
        setTimeout(() => { messageDiv.classList.add('visible'); }, 10);
        // Add to conversation history
        this.conversationHistory.push({ text, sender, timestamp: new Date() });
        this.saveConversationHistory();
        this.scrollToBottom();
    }

    handleQuickSuggestion(suggestion) {
        const input = document.getElementById('chatbot-input-field');
        input.value = suggestion;
        this.sendMessage();
    }

    updateQuickSuggestions() {
        const suggestionsContainer = document.getElementById('quick-suggestions');
        const suggestions = this.getContextualSuggestions();
        
        suggestionsContainer.innerHTML = suggestions.map(suggestion => 
            `<button class="quick-suggestion">${suggestion}</button>`
        ).join('');
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        indicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        indicator.style.display = 'none';
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('enhanced-chatbot-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    startTypingAnimation() {
        const dots = document.querySelectorAll('.typing-dots span');
        let currentDot = 0;
        
            setInterval(() => {
            dots.forEach((dot, index) => {
                dot.style.opacity = index === currentDot ? '1' : '0.3';
            });
            currentDot = (currentDot + 1) % dots.length;
        }, 300);
    }

    saveConversationHistory() {
        localStorage.setItem('chatbotHistory', JSON.stringify(this.conversationHistory.slice(-50)));
    }

    loadConversationHistory() {
        const history = localStorage.getItem('chatbotHistory');
        if (history) {
            this.conversationHistory = JSON.parse(history);
        }
    }

    // Notification methods for real-time updates
    notifyJobUpdate(jobId, status) {
        this.addMessage(`Job #${jobId} status updated to: ${status}`, 'bot');
    }

    notifyPayment(amount) {
        this.addMessage(`Payment of ₹${amount} received successfully!`, 'bot');
    }

    notifyBooking(service) {
        this.addMessage(`Appointment booked for ${service}! We'll contact you with confirmation details.`, 'bot');
    }

    notifyInventoryLow(item) {
        this.addMessage(`Low stock alert: ${item} is running low. Please reorder soon.`, 'bot');
    }

    async handleBookingFlow(userInput) {
        const input = document.getElementById('chatbot-input-field');
        const send = document.getElementById('chatbot-send');
        if (input && send) {
            input.disabled = true;
            send.disabled = true;
            var oldPlaceholder = input.placeholder;
            input.placeholder = 'Please wait...';
        }
        if (/cancel|exit|reset|stop/i.test((userInput || '').toLowerCase())) {
            this.bookingContext = null;
            return { text: 'Booking cancelled.', suggestions: ['Help', 'Book Appointment'] };
        }
        // Steps: 0=service, 1=vehicle, 2=date, 3=branch, 4=confirm
        const ctx = this.bookingContext;
        if (!ctx) return { text: 'Booking flow not started.', suggestions: [] };
        // Step 0: Ask for service
        if (ctx.step === 0) {
            if (userInput) ctx.data.service = userInput;
            if (!ctx.data.service) {
                // Fetch services
                try {
                    const res = await fetch('http://localhost:8080/api/services');
                    const services = await res.json();
                    ctx.services = services;
                    return { text: 'Which service would you like to book?\n' + services.map(s => s.serviceName).join(', '), suggestions: services.slice(0,4).map(s => s.serviceName) };
                } catch {
                    return { text: 'Unable to load services. Please try again later.', suggestions: [] };
                }
            } else {
                ctx.step = 1;
            }
        }
        // Step 1: Ask for vehicle
        if (ctx.step === 1) {
            if (userInput && !ctx.data.vehicle) ctx.data.vehicle = userInput;
            if (!ctx.data.vehicle) {
                // Fetch vehicles
                try {
                    const res = await fetch(`http://localhost:8080/api/customer/vehicles/${this.userContext.userId}`);
                    const vehicles = await res.json();
                    ctx.vehicles = vehicles;
                    return { text: 'Which vehicle?\n' + vehicles.map(v => v.make + ' ' + v.model + ' (' + v.year + ')').join(', '), suggestions: vehicles.slice(0,4).map(v => v.make + ' ' + v.model) };
                } catch {
                    return { text: 'Unable to load vehicles. Please try again later.', suggestions: [] };
                }
            } else {
                ctx.step = 2;
            }
        }
        // Step 2: Ask for date
        if (ctx.step === 2) {
            if (userInput && !ctx.data.date) ctx.data.date = userInput;
            if (!ctx.data.date) {
                return { text: 'What date would you like to book? (YYYY-MM-DD)', suggestions: [] };
            } else {
                ctx.step = 3;
            }
        }
        // Step 3: Ask for branch
        if (ctx.step === 3) {
            if (userInput && !ctx.data.branch) ctx.data.branch = userInput;
            if (!ctx.data.branch) {
                // Fetch branches
                try {
                    const res = await fetch('http://localhost:8080/api/customer/branches');
                    const branches = await res.json();
                    ctx.branches = branches;
                    return { text: 'Which branch?\n' + branches.map(b => b.name).join(', '), suggestions: branches.slice(0,4).map(b => b.name) };
                } catch {
                    return { text: 'Unable to load branches. Please try again later.', suggestions: [] };
                }
            } else {
                ctx.step = 4;
            }
        }
        // Step 4: Confirm and submit
        if (ctx.step === 4) {
            // Find IDs for service, vehicle, branch
            const serviceObj = ctx.services?.find(s => s.serviceName.toLowerCase() === ctx.data.service.toLowerCase());
            const vehicleObj = ctx.vehicles?.find(v => (v.make + ' ' + v.model).toLowerCase() === ctx.data.vehicle.toLowerCase());
            const branchObj = ctx.branches?.find(b => b.name.toLowerCase() === ctx.data.branch.toLowerCase());
            if (!serviceObj || !vehicleObj || !branchObj) {
                this.bookingContext = null;
                return { text: 'Invalid selection. Please start booking again.', suggestions: [] };
            }
            // POST booking
            try {
                const res = await fetch('http://localhost:8080/api/customer/book', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerId: this.userContext.userId,
                        vehicleId: vehicleObj.id,
                        serviceId: serviceObj.id,
                        branchId: branchObj.id,
                        bookingDate: ctx.data.date
                    })
                });
                if (res.ok) {
                    this.bookingContext = null;
                    return { text: `Appointment booked for ${serviceObj.serviceName} on ${ctx.data.date} at ${branchObj.name}.`, suggestions: ['Book Another', 'View My Jobs'] };
                } else {
                    this.bookingContext = null;
                    return { text: 'Booking failed. Please try again later.', suggestions: [] };
                }
            } catch {
                this.bookingContext = null;
                return { text: 'Booking failed. Please try again later.', suggestions: [] };
            }
        }
        // Ask next question
        return await this.handleBookingFlow();
    }

    async handlePaymentFlow(userInput) {
        const input = document.getElementById('chatbot-input-field');
        const send = document.getElementById('chatbot-send');
        if (input && send) {
            input.disabled = true;
            send.disabled = true;
            var oldPlaceholder = input.placeholder;
            input.placeholder = 'Please wait...';
        }
        if (/cancel|exit|reset|stop/i.test((userInput || '').toLowerCase())) {
            this.paymentContext = null;
            return { text: 'Payment cancelled.', suggestions: ['Help', 'Pay Invoice'] };
        }
        // Steps: 0=show invoices, 1=select invoice, 2=confirm payment
        const ctx = this.paymentContext;
        if (!ctx) return { text: 'Payment flow not started.', suggestions: [] };
        // Step 0: Fetch and show unpaid invoices
        if (ctx.step === 0) {
            try {
                const res = await fetch(`http://localhost:8080/api/customer/jobs/${this.userContext.userId}`);
                const jobs = await res.json();
                // Assume each job has an invoice if totalCost > 0 and status != 'Paid'
                ctx.invoices = jobs.filter(j => j.totalCost && j.status !== 'Paid');
                if (!ctx.invoices.length) {
                    this.paymentContext = null;
                    return { text: 'You have no unpaid invoices at this time.', suggestions: ['Help', 'View My Jobs'] };
                }
                ctx.step = 1;
                return { text: 'Here are your unpaid invoices:\n' + ctx.invoices.map(inv => `Invoice #${inv.jobId}: ${inv.service || inv.serviceName} - ₹${inv.totalCost} (Job Date: ${inv.bookingDate?.split('T')[0] || ''})`).join('\n'), suggestions: ctx.invoices.slice(0,3).map(inv => `Pay Invoice #${inv.jobId}`) };
            } catch {
                this.paymentContext = null;
                return { text: 'Unable to fetch invoices. Please try again later.', suggestions: [] };
            }
        }
        // Step 1: Select invoice
        if (ctx.step === 1) {
            let selectedId = null;
            if (userInput) {
                // Try to extract invoice/job ID
                const match = userInput.match(/\d+/);
                if (match) selectedId = parseInt(match[0]);
            }
            if (!selectedId) {
                return { text: 'Please enter the invoice number you want to pay (e.g., Invoice #123).', suggestions: ctx.invoices.slice(0,3).map(inv => `Pay Invoice #${inv.jobId}`) };
            }
            const invoice = ctx.invoices.find(inv => inv.jobId === selectedId);
            if (!invoice) {
                return { text: 'Invalid invoice number. Please try again.', suggestions: ctx.invoices.slice(0,3).map(inv => `Pay Invoice #${inv.jobId}`) };
            }
            ctx.selectedInvoice = invoice;
            ctx.step = 2;
        }
        // Step 2: Confirm and pay
        if (ctx.step === 2) {
            const invoice = ctx.selectedInvoice;
            if (!invoice) {
                this.paymentContext = null;
                return { text: 'Payment error. Please start again.', suggestions: [] };
            }
            // POST payment
            try {
                const res = await fetch('http://localhost:8080/api/customer/pay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerId: this.userContext.userId,
                        jobId: invoice.jobId,
                        amount: invoice.totalCost
                    })
                });
                if (res.ok) {
                    this.paymentContext = null;
                    return { text: `Payment of ₹${invoice.totalCost} for Invoice #${invoice.jobId} was successful!`, suggestions: ['View My Jobs', 'Help'] };
                } else {
                    this.paymentContext = null;
                    return { text: 'Payment failed. Please try again later.', suggestions: [] };
                }
            } catch {
                this.paymentContext = null;
                return { text: 'Payment failed. Please try again later.', suggestions: [] };
            }
        }
        // Ask next question
        return await this.handlePaymentFlow();
    }

    async handleJobDetailsFlow(userInput) {
        const input = document.getElementById('chatbot-input-field');
        const send = document.getElementById('chatbot-send');
        if (input && send) {
            input.disabled = true;
            send.disabled = true;
            var oldPlaceholder = input.placeholder;
            input.placeholder = 'Please wait...';
        }
        if (/cancel|exit|reset|stop/i.test((userInput || '').toLowerCase())) {
            this.jobDetailsContext = null;
            return { text: 'Job details cancelled.', suggestions: ['Help', 'Check Status'] };
        }
        const ctx = this.jobDetailsContext;
        if (!ctx) return { text: 'Job details flow not started.', suggestions: [] };
        // Step 0: Fetch and show job details
        if (ctx.step === 0) {
            try {
                let res, job;
                if (this.userContext.role === 'employee') {
                    res = await fetch(`http://localhost:8080/api/employee/jobs/${ctx.jobId}/details`);
                    job = await res.json();
                } else if (this.userContext.role === 'admin') {
                    res = await fetch('http://localhost:8080/api/admin/jobs');
                    const jobs = await res.json();
                    job = Array.isArray(jobs) ? jobs.find(j => j.jobId === ctx.jobId) : null;
                } else {
                    res = await fetch(`http://localhost:8080/api/customer/jobs/${this.userContext.userId}`);
                    const jobs = await res.json();
                    job = Array.isArray(jobs) ? jobs.find(j => j.jobId === ctx.jobId) : null;
                }
                if (!job) {
                    this.jobDetailsContext = null;
                    return { text: `Job #${ctx.jobId} not found.`, suggestions: ['Help', 'Check Status'] };
                }
                ctx.job = job;
                ctx.step = 1;
                let text = `Job #${job.jobId}\nStatus: ${job.status}\nService: ${job.service || job.serviceName}\nVehicle: ${job.vehicle || ''}\nDate: ${job.bookingDate ? job.bookingDate.split('T')[0] : ''}`;
                if (job.totalCost) text += `\nTotal: ₹${job.totalCost}`;
                if (job.notes) text += `\nNotes: ${job.notes}`;
                let suggestions = ['Close', 'Help'];
                if (this.userContext.role === 'employee' || this.userContext.role === 'admin') {
                    suggestions = ['Update Status', 'Add Note', ...suggestions];
                }
                return { text, suggestions };
            } catch {
                this.jobDetailsContext = null;
                return { text: 'Unable to fetch job details. Please try again later.', suggestions: ['Help'] };
            }
        }
        // Step 1: Follow-up actions (employee/admin)
        if (ctx.step === 1 && (this.userContext.role === 'employee' || this.userContext.role === 'admin')) {
            if (/update status/i.test(userInput)) {
                ctx.step = 2;
                return { text: 'Enter new status (In Progress or Completed):', suggestions: ['In Progress', 'Completed'] };
            }
            if (/add note/i.test(userInput)) {
                ctx.step = 3;
                return { text: 'Enter note to add to this job:', suggestions: [] };
            }
            if (/close|exit|done/i.test(userInput)) {
                this.jobDetailsContext = null;
                return { text: 'Job details closed.', suggestions: ['Help'] };
            }
            return { text: 'You can update status, add note, or close.', suggestions: ['Update Status', 'Add Note', 'Close'] };
        }
        // Step 2: Update status
        if (ctx.step === 2) {
            const newStatus = userInput && userInput.match(/in progress|completed/i);
            if (!newStatus) {
                return { text: 'Invalid status. Please enter "In Progress" or "Completed".', suggestions: ['In Progress', 'Completed'] };
            }
            // Update status via API
            try {
                let url, method = 'PUT';
                if (this.userContext.role === 'employee') {
                    url = `http://localhost:8080/api/employee/jobs/${ctx.jobId}/status`;
                } else {
                    url = 'http://localhost:8080/api/admin/jobs';
                }
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId: ctx.jobId, status: newStatus[0] })
                });
                if (res.ok) {
                    this.jobDetailsContext = null;
                    return { text: `Job #${ctx.jobId} status updated to ${newStatus[0]}.`, suggestions: ['Help'] };
                } else {
                    this.jobDetailsContext = null;
                    return { text: 'Failed to update status. Please try again.', suggestions: ['Help'] };
                }
            } catch {
                this.jobDetailsContext = null;
                return { text: 'Failed to update status. Please try again.', suggestions: ['Help'] };
            }
        }
        // Step 3: Add note
        if (ctx.step === 3) {
            if (!userInput) {
                return { text: 'Please enter a note to add.', suggestions: [] };
            }
            // Add note via API
            try {
                let url, method = 'POST';
                if (this.userContext.role === 'employee') {
                    url = `http://localhost:8080/api/employee/jobs/${ctx.jobId}/notes`;
                } else {
                    url = 'http://localhost:8080/api/admin/jobs';
                }
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId: ctx.jobId, notes: userInput })
                });
                if (res.ok) {
                    this.jobDetailsContext = null;
                    return { text: `Note added to Job #${ctx.jobId}.`, suggestions: ['Help'] };
                } else {
                    this.jobDetailsContext = null;
                    return { text: 'Failed to add note. Please try again.', suggestions: ['Help'] };
                }
            } catch {
                this.jobDetailsContext = null;
                return { text: 'Failed to add note. Please try again.', suggestions: ['Help'] };
            }
        }
        // Default: close
        this.jobDetailsContext = null;
        return { text: 'Job details flow ended.', suggestions: ['Help'] };
    }

    async handleUserManagementFlow(userInput) {
        const input = document.getElementById('chatbot-input-field');
        const send = document.getElementById('chatbot-send');
        if (input && send) {
            input.disabled = true;
            send.disabled = true;
            var oldPlaceholder = input.placeholder;
            input.placeholder = 'Please wait...';
        }
        if (/cancel|exit|reset|stop/i.test((userInput || '').toLowerCase())) {
            this.userManagementContext = null;
            return { text: 'User management cancelled.', suggestions: ['Help', 'User Management'] };
        }
        const ctx = this.userManagementContext;
        if (!ctx) return { text: 'User management flow not started.', suggestions: [] };
        // Step 0: Ask for action
        if (ctx.step === 0) {
            if (/view users/i.test(userInput)) ctx.action = 'view';
            else if (/add user/i.test(userInput)) ctx.action = 'add';
            else if (/deactivate|remove user/i.test(userInput)) ctx.action = 'deactivate';
            if (!ctx.action) {
                return { text: 'What would you like to do? (View Users, Add User, Deactivate User)', suggestions: ['View Users', 'Add User', 'Deactivate User', 'Cancel'] };
            }
            ctx.step = 1;
        }
        // Step 1: Perform action
        if (ctx.step === 1) {
            if (ctx.action === 'view') {
                // Fetch and show users
                try {
                    const res = await fetch('http://localhost:8080/api/admin/users');
                    const users = await res.json();
                    if (!Array.isArray(users) || users.length === 0) {
                        this.userManagementContext = null;
                        return { text: 'No users found.', suggestions: ['Add User', 'Help'] };
                    }
                    this.userManagementContext = null;
                    return { text: 'Here are the first few users:\n' + users.slice(0,5).map(u => `• ${u.fullName} (${u.role})${u.isActive === false ? ' [Inactive]' : ''}`).join('\n'), suggestions: ['Add User', 'Deactivate User', 'Help'] };
                } catch {
                    this.userManagementContext = null;
                    return { text: 'Unable to fetch users. Please try again later.', suggestions: ['Help'] };
                }
            }
            if (ctx.action === 'add') {
                ctx.step = 2;
                return { text: 'Enter new user details as: Name, Email, Role (admin/employee/customer)', suggestions: [] };
            }
            if (ctx.action === 'deactivate') {
                ctx.step = 3;
                return { text: 'Enter the email of the user to deactivate:', suggestions: [] };
            }
        }
        // Step 2: Add user
        if (ctx.step === 2 && ctx.action === 'add') {
            // Parse input: Name, Email, Role
            const parts = userInput.split(',').map(s => s.trim());
            if (parts.length < 3) {
                return { text: 'Please enter all details: Name, Email, Role', suggestions: [] };
            }
            const [fullName, email, role] = parts;
            try {
                const res = await fetch('http://localhost:8080/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, role })
                });
                if (res.ok) {
                    this.userManagementContext = null;
                    return { text: `User ${fullName} added successfully!`, suggestions: ['View Users', 'Add User', 'Help'] };
                } else {
                    this.userManagementContext = null;
                    return { text: 'Failed to add user. Please try again.', suggestions: ['Help'] };
                }
            } catch {
                this.userManagementContext = null;
                return { text: 'Failed to add user. Please try again.', suggestions: ['Help'] };
            }
        }
        // Step 3: Deactivate user
        if (ctx.step === 3 && ctx.action === 'deactivate') {
            const email = userInput.trim();
            if (!email) {
                return { text: 'Please enter the email of the user to deactivate.', suggestions: [] };
            }
            try {
                const res = await fetch('http://localhost:8080/api/admin/users', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, isActive: false })
                });
                if (res.ok) {
                    this.userManagementContext = null;
                    return { text: `User ${email} deactivated.`, suggestions: ['View Users', 'Help'] };
                } else {
                    this.userManagementContext = null;
                    return { text: 'Failed to deactivate user. Please try again.', suggestions: ['Help'] };
                }
            } catch {
                this.userManagementContext = null;
                return { text: 'Failed to deactivate user. Please try again.', suggestions: ['Help'] };
            }
        }
        // Cancel
        if (/cancel|exit|done/i.test(userInput)) {
            this.userManagementContext = null;
            return { text: 'User management cancelled.', suggestions: ['Help'] };
        }
        // Default
        this.userManagementContext = null;
        return { text: 'User management flow ended.', suggestions: ['Help'] };
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedChatbot = new EnhancedChatbot();
});