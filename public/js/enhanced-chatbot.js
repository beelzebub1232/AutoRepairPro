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
                        <svg class="icon" viewBox="0 0 24 24">
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
                    <div id="enhanced-chatbot-messages" class="enhanced-chatbot-messages">
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
                            <input type="text" id="chatbot-input-field" placeholder="Type your message..." autocomplete="off">
                            <button id="chatbot-send" class="send-button">
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
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Process message and get response
        setTimeout(async () => {
            const response = await this.processMessage(message);
            this.addMessage(response.text, 'bot', response.suggestions);
            this.hideTypingIndicator();
        }, 1000);
    }

    async processMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Detect intent and get appropriate response
        if (this.detectIntent(lowerMessage, ['hello', 'hi', 'hey', 'good morning', 'good afternoon'])) {
            return this.getGreetingResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['book', 'appointment', 'schedule', 'service'])) {
            return await this.getBookingResponse();
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
            return await this.getPaymentResponse();
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
            // const response = await fetch('http://localhost:8080/api/admin/services');
            const serviceList = "Service List Placeholder";
            
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
        if (this.userContext.role === 'customer') {
            return {
                text: "To check your job status, please visit the 'My Jobs' section in your dashboard. You can see all your current and past jobs there.",
                suggestions: ['View My Jobs', 'Contact Support', 'Dashboard']
            };
        } else if (this.userContext.role === 'employee') {
            return {
                text: "To check your assigned jobs, please visit the 'Assigned Jobs' section in your dashboard. You can update job status and add notes there.",
                suggestions: ['View Assigned Jobs', 'Update Status', 'Dashboard']
            };
        } else {
            return {
                text: "To check job status, please visit the 'Jobs' section in your admin dashboard. You can view and manage all jobs there.",
                suggestions: ['View All Jobs', 'Manage Jobs', 'Dashboard']
            };
        }
    }

    async getServicesResponse() {
        try {
            // const response = await fetch('http://localhost:8080/api/admin/services');
            const serviceList = "Service List Placeholder";
            
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
            // const response = await fetch('http://localhost:8080/api/admin/services');
            const pricingList = "Pricing List Placeholder";
            
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
            return {
                text: "To make a payment, please visit the 'My Jobs' section in your dashboard. You can view invoices and make payments for completed jobs there.",
                suggestions: ['View My Jobs', 'Make Payment', 'Contact Support']
            };
        } else {
            return {
                text: "For payment information, please contact our support team or visit the payments section in your dashboard.",
                suggestions: ['Contact Support', 'View Payments', 'Help']
            };
        }
    }
    
    async getInventoryResponse() {
        if (this.userContext.role === 'admin' || this.userContext.role === 'employee') {
            return {
                text: "To check inventory, please visit the 'Inventory' section in your dashboard. You can view stock levels, add items, and manage inventory there.",
                suggestions: ['View Inventory', 'Add Items', 'Check Stock']
            };
        } else {
            return {
                text: "For inventory and parts information, please contact our support team. They can help you with specific part availability and pricing.",
                suggestions: ['Contact Support', 'View Services', 'Help']
            };
        }
    }

    async getReportsResponse() {
        if (this.userContext.role === 'admin') {
            return {
                text: "To view reports, please visit the 'Reports' section in your admin dashboard. You can access revenue reports, employee performance, and other analytics there.",
                suggestions: ['View Reports', 'Export Data', 'Analytics']
            };
        } else {
            return {
                text: "Reports are available to administrators only. Please contact your administrator for access to reports and analytics.",
                suggestions: ['Contact Admin', 'Help', 'Support']
            };
        }
    }

    async getLocationResponse() {
        try {
            // const response = await fetch('http://localhost:8080/api/customer/branches');
            const branchList = "Branch List Placeholder";
            
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
            // const response = await fetch('http://localhost:8080/api/customer/branches');
            const hoursList = "Hours List Placeholder";
            
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
            // const response = await fetch('http://localhost:8080/api/customer/branches');
            const contactList = "Contact List Placeholder";
            
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
        messageDiv.className = `chatbot-message ${sender}-message`;
        
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
                    ${suggestions.map(suggestion => 
                        `<button class="quick-suggestion">${suggestion}</button>`
                    ).join('')}
                </div>
            ` : ''}
            </div>
        `;
        
        messageDiv.innerHTML = avatar + messageContent;
        messagesContainer.appendChild(messageDiv);
        
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
        this.addMessage(`Payment of $${amount} received successfully!`, 'bot');
    }

    notifyBooking(service) {
        this.addMessage(`Appointment booked for ${service}! We'll contact you with confirmation details.`, 'bot');
    }

    notifyInventoryLow(item) {
        this.addMessage(`Low stock alert: ${item} is running low. Please reorder soon.`, 'bot');
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedChatbot = new EnhancedChatbot();
});