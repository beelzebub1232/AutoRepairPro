// Enhanced Chatbot with Modern UI and Better Functionality
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
                    <div class="chatbot-icon">💬</div>
                    <div class="chatbot-pulse"></div>
                </div>
                <div id="enhanced-chatbot-window" class="enhanced-chatbot-window">
                    <div class="chatbot-header">
                        <div class="chatbot-avatar">🤖</div>
                        <div class="chatbot-info">
                            <h4>RepairHub Assistant</h4>
                            <span class="chatbot-status">Online</span>
                        </div>
                        <div class="chatbot-controls">
                            <button id="chatbot-minimize" class="chatbot-control-btn" title="Minimize">
                                <span>−</span>
                            </button>
                            <button id="chatbot-close" class="chatbot-control-btn" title="Close">
                                <span>×</span>
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
                                <span>➤</span>
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
                text: `Hello ${name}! 👋 I'm your RepairHub assistant. I can help you with managing operations, viewing reports, and system administration. How can I assist you today?`,
                suggestions: ['View Reports', 'Manage Inventory', 'Check Job Status', 'User Management']
            },
            employee: {
                text: `Hi ${name}! 🔧 I'm here to help you with your assigned jobs, inventory management, and work-related queries. What do you need help with?`,
                suggestions: ['My Jobs', 'Update Job Status', 'Check Inventory', 'Report Issue']
            },
            customer: {
                text: `Welcome ${name}! 🚗 I can help you book appointments, check your job status, and answer questions about our services. How may I help you?`,
                suggestions: ['Book Appointment', 'Check Job Status', 'View Services', 'Payment Help']
            }
        };

        return messages[role] || {
            text: "Hello! 👋 I'm your RepairHub assistant. How can I help you today?",
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
            this.hideTypingIndicator();
            this.addMessage(response.text, 'bot', response.suggestions);
        }, 1000 + Math.random() * 1000); // Simulate thinking time
    }

    async processMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Context-aware responses based on user role
        const role = this.userContext.role;
        
        // Intent detection with enhanced responses
        if (this.detectIntent(lowerMessage, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings'])) {
            return this.getGreetingResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['book', 'appointment', 'schedule', 'reserve'])) {
            return this.getBookingResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['status', 'progress', 'update', 'check', 'track'])) {
            return this.getStatusResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['service', 'services', 'what do you offer', 'repair', 'maintenance'])) {
            return await this.getServicesResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['price', 'cost', 'quote', 'estimate', 'how much', 'pricing'])) {
            return this.getPricingResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['payment', 'pay', 'invoice', 'bill', 'charge'])) {
            return this.getPaymentResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['inventory', 'parts', 'stock', 'supplies'])) {
            return this.getInventoryResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['report', 'analytics', 'dashboard', 'statistics'])) {
            return this.getReportsResponse();
        }
        
        if (this.detectIntent(lowerMessage, ['help', 'support', 'assistance', 'guide'])) {
            return this.getHelpResponse();
        }

        if (this.detectIntent(lowerMessage, ['location', 'address', 'where', 'branch', 'office'])) {
            return this.getLocationResponse();
        }

        if (this.detectIntent(lowerMessage, ['hours', 'open', 'close', 'time', 'when'])) {
            return this.getHoursResponse();
        }

        if (this.detectIntent(lowerMessage, ['contact', 'phone', 'email', 'reach'])) {
            return this.getContactResponse();
        }
        
        // Role-specific responses
        if (role === 'admin' && this.detectIntent(lowerMessage, ['user', 'employee', 'customer', 'manage', 'staff'])) {
            return this.getUserManagementResponse();
        }
        
        if (role === 'employee' && this.detectIntent(lowerMessage, ['job', 'task', 'assigned', 'work', 'duty'])) {
            return this.getEmployeeJobResponse();
        }
        
        // Default response with suggestions
        return this.getDefaultResponse();
    }

    detectIntent(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }

    getGreetingResponse() {
        const greetings = [
            "Hello! 😊 How can I assist you today?",
            "Hi there! 👋 What can I help you with?",
            "Good to see you! 🌟 How may I help?",
            "Hello! I'm here to help with any questions you have. 💬"
        ];
        
        return {
            text: greetings[Math.floor(Math.random() * greetings.length)],
            suggestions: this.getContextualSuggestions()
        };
    }

    getBookingResponse() {
        const role = this.userContext.role;
        
        if (role === 'customer') {
            return {
                text: "I'd be happy to help you book an appointment! 📅 You can book through your dashboard by selecting your vehicle, choosing a service, and picking a date. Would you like me to guide you through the process?",
                suggestions: ['Go to Booking', 'View Services', 'Select Branch', 'Check Availability']
            };
        } else {
            return {
                text: "To book appointments, customers can use their dashboard or you can help them through the admin panel. 📋 Would you like to know more about the booking process?",
                suggestions: ['Booking Process', 'Admin Tools', 'Customer Help']
            };
        }
    }

    getStatusResponse() {
        const role = this.userContext.role;
        
        if (role === 'customer') {
            return {
                text: "You can check your job status in the 'My Jobs' section of your dashboard. 📊 I can also help you understand what each status means. What would you like to know?",
                suggestions: ['View My Jobs', 'Status Meanings', 'Expected Timeline']
            };
        } else if (role === 'employee') {
            return {
                text: "You can view and update job statuses in your assigned jobs section. 🔧 Need help with updating a specific job status?",
                suggestions: ['My Assigned Jobs', 'Update Status', 'Job Details']
            };
        } else {
            return {
                text: "As an admin, you can view all job statuses and manage assignments. 📈 What specific information do you need?",
                suggestions: ['All Jobs', 'Job Analytics', 'Status Reports']
            };
        }
    }

    async getServicesResponse() {
        try {
            const response = await fetch('http://localhost:8080/api/services');
            const services = await response.json();
            
            let servicesList = "Here are our available services: 🔧\n\n";
            services.slice(0, 5).forEach(service => {
                servicesList += `• ${service.serviceName} - $${service.price}\n`;
            });
            
            if (services.length > 5) {
                servicesList += `\n...and ${services.length - 5} more services available! 📋`;
            }
            
            return {
                text: servicesList,
                suggestions: ['Book Service', 'Get Quote', 'Service Details', 'Compare Prices']
            };
        } catch (error) {
            return {
                text: "I'm having trouble loading our services right now. 😅 Please try again later or contact us directly for service information.",
                suggestions: ['Contact Support', 'Try Again', 'View Dashboard']
            };
        }
    }

    getPricingResponse() {
        return {
            text: "Our pricing varies by service type and complexity. 💰 We provide detailed estimates before starting any work. You can view base prices in our services list, and we'll give you a complete quote after assessing your vehicle.",
            suggestions: ['View Services', 'Get Quote', 'Book Consultation', 'Price Breakdown']
        };
    }

    getPaymentResponse() {
        return {
            text: "We accept multiple payment methods including credit/debit cards, UPI, and digital wallets. 💳 Once your service is completed, you'll receive an invoice through your dashboard and can pay securely online.",
            suggestions: ['Payment Methods', 'View Invoices', 'Payment Help', 'Billing Questions']
        };
    }

    getInventoryResponse() {
        const role = this.userContext.role;
        
        if (role === 'admin' || role === 'employee') {
            return {
                text: "I can help you with inventory management. 📦 You can check stock levels, view low-stock alerts, and manage parts usage. What do you need to know?",
                suggestions: ['Check Stock', 'Low Stock Alerts', 'Add Parts', 'Usage Reports']
            };
        } else {
            return {
                text: "We maintain a comprehensive inventory of quality parts for all our services. 🔧 If you have questions about specific parts for your vehicle, I can help connect you with our team.",
                suggestions: ['Contact Team', 'Service Info', 'Part Warranty']
            };
        }
    }

    getReportsResponse() {
        const role = this.userContext.role;
        
        if (role === 'admin') {
            return {
                text: "I can help you access various reports including revenue analytics, job performance, inventory usage, and employee productivity. 📊 What type of report are you looking for?",
                suggestions: ['Revenue Report', 'Job Analytics', 'Inventory Report', 'Export Data']
            };
        } else {
            return {
                text: "Detailed reports are available through the admin dashboard. 📈 If you need specific information, I can help you find what you're looking for.",
                suggestions: ['Contact Admin', 'Basic Stats', 'My Performance']
            };
        }
    }

    getLocationResponse() {
        return {
            text: "We have multiple locations to serve you better! 📍 Our main branches are:\n\n• RepairHub Pro Downtown - 123 Main Street\n• RepairHub Pro Uptown - 456 Oak Avenue\n• RepairHub Pro Westside - 789 Pine Road\n\nYou can select your preferred location when booking an appointment.",
            suggestions: ['Book Appointment', 'Get Directions', 'Branch Hours', 'Contact Branch']
        };
    }

    getHoursResponse() {
        return {
            text: "Our operating hours vary by location: ⏰\n\n• Downtown: Mon-Fri 8AM-6PM, Sat 9AM-4PM\n• Uptown: Mon-Fri 7AM-7PM, Sat 8AM-5PM\n• Westside: Mon-Sat 8AM-6PM\n\nWe're closed on Sundays for maintenance and staff rest.",
            suggestions: ['Book Appointment', 'Emergency Service', 'Holiday Hours', 'Contact Us']
        };
    }

    getContactResponse() {
        return {
            text: "You can reach us through multiple channels: 📞\n\n• Phone: (555) 123-REPAIR\n• Email: support@repairhubpro.com\n• Live Chat: Right here with me!\n• Emergency: (555) 911-AUTO\n\nI'm available 24/7 to help with basic questions!",
            suggestions: ['Call Now', 'Send Email', 'Emergency Help', 'Book Appointment']
        };
    }

    getHelpResponse() {
        const role = this.userContext.role;
        
        const helpText = {
            admin: "I can help you with system administration, user management, reports, inventory, and job oversight. 🛠️ What do you need assistance with?",
            employee: "I can help you with job management, status updates, inventory usage, and work-related questions. 🔧 How can I assist?",
            customer: "I can help you book appointments, check job status, understand our services, and handle payments. 🚗 What do you need help with?"
        };
        
        return {
            text: helpText[role] || "I'm here to help! 😊 What do you need assistance with?",
            suggestions: this.getContextualSuggestions()
        };
    }

    getUserManagementResponse() {
        return {
            text: "I can help you with user management tasks including adding new employees, managing customer accounts, and setting user permissions. 👥 What would you like to do?",
            suggestions: ['Add Employee', 'Manage Customers', 'User Permissions', 'Account Settings']
        };
    }

    getEmployeeJobResponse() {
        return {
            text: "I can help you with your assigned jobs, updating statuses, managing parts usage, and viewing job details. 🔧 What do you need help with?",
            suggestions: ['View My Jobs', 'Update Status', 'Use Parts', 'Job Details']
        };
    }

    getDefaultResponse() {
        const responses = [
            "I'm not sure I understand that. 🤔 Could you rephrase your question?",
            "I didn't quite catch that. 😅 Can you try asking in a different way?",
            "I'm here to help! 💪 Could you be more specific about what you need?",
            "I want to make sure I give you the right information. 🎯 Could you clarify what you're looking for?"
        ];
        
        return {
            text: responses[Math.floor(Math.random() * responses.length)],
            suggestions: this.getContextualSuggestions()
        };
    }

    getContextualSuggestions() {
        const role = this.userContext.role;
        
        const suggestions = {
            admin: ['View Reports', 'Manage Users', 'Check Inventory', 'Job Overview'],
            employee: ['My Jobs', 'Update Status', 'Check Parts', 'Help'],
            customer: ['Book Appointment', 'Check Status', 'View Services', 'Payment']
        };
        
        return suggestions[role] || ['Help', 'Services', 'Contact', 'About'];
    }

    addMessage(text, sender, suggestions = []) {
        const messagesContainer = document.getElementById('enhanced-chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${text}</div>
                <div class="message-time">${timestamp}</div>
            </div>
            ${suggestions.length > 0 ? `
                <div class="message-suggestions">
                    ${suggestions.map(suggestion => 
                        `<button class="quick-suggestion">${suggestion}</button>`
                    ).join('')}
                </div>
            ` : ''}
        `;
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Save to conversation history
        this.conversationHistory.push({
            text,
            sender,
            timestamp: new Date().toISOString(),
            suggestions
        });
        
        this.saveConversationHistory();
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
        // Add subtle animation to the toggle button
        const toggle = document.getElementById('enhanced-chatbot-toggle');
        if (toggle) {
            setInterval(() => {
                if (!this.isOpen) {
                    toggle.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        toggle.style.transform = 'scale(1)';
                    }, 200);
                }
            }, 5000);
        }
    }

    saveConversationHistory() {
        localStorage.setItem('repairhub_enhanced_chatbot_history', JSON.stringify(this.conversationHistory.slice(-50)));
    }

    loadConversationHistory() {
        const saved = localStorage.getItem('repairhub_enhanced_chatbot_history');
        if (saved) {
            this.conversationHistory = JSON.parse(saved);
        }
    }

    // Public methods for other parts of the application
    notifyJobUpdate(jobId, status) {
        this.addMessage(`🔔 Job #${jobId} status updated to ${status}`, 'bot');
    }

    notifyPayment(amount) {
        this.addMessage(`💳 Payment of $${amount} has been processed successfully`, 'bot');
    }

    notifyBooking(service) {
        this.addMessage(`📅 Your ${service} appointment has been confirmed`, 'bot');
    }

    notifyInventoryLow(item) {
        this.addMessage(`⚠️ ${item} is running low in inventory`, 'bot');
    }
}

// Initialize enhanced chatbot
document.addEventListener('DOMContentLoaded', () => {
    // Remove old chatbot if exists
    const oldChatbot = document.getElementById('chatbot-container');
    if (oldChatbot) {
        oldChatbot.remove();
    }
    
    window.enhancedChatbot = new EnhancedChatbot();
});