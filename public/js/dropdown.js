// Dropdown Utility Functions
class DropdownManager {
    constructor() {
        this.activeDropdown = null;
        this.init();
    }

    init() {
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                this.closeAllDropdowns();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });

        // Initialize existing dropdowns
        this.initializeDropdowns();
    }

    initializeDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            this.setupDropdown(dropdown);
        });
    }

    setupDropdown(dropdown) {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (!toggle || !menu) return;

        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDropdown(dropdown);
        });

        // Handle item clicks
        const items = menu.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleItemClick(dropdown, item);
            });

            // Keyboard navigation
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleItemClick(dropdown, item);
                }
            });
        });

        // Search functionality
        const searchInput = menu.querySelector('.dropdown-search input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterDropdownItems(dropdown, e.target.value);
            });
        }
    }

    toggleDropdown(dropdown) {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (this.activeDropdown && this.activeDropdown !== dropdown) {
            this.closeDropdown(this.activeDropdown);
        }

        if (menu.classList.contains('show')) {
            this.closeDropdown(dropdown);
        } else {
            this.openDropdown(dropdown);
        }
    }

    openDropdown(dropdown) {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        toggle.classList.add('active');
        menu.classList.add('show');
        this.activeDropdown = dropdown;

        // Focus first item for keyboard navigation
        const firstItem = menu.querySelector('.dropdown-item');
        if (firstItem) {
            firstItem.focus();
        }
    }

    closeDropdown(dropdown) {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        toggle.classList.remove('active');
        menu.classList.remove('show');
        
        if (this.activeDropdown === dropdown) {
            this.activeDropdown = null;
        }
    }

    closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            this.closeDropdown(dropdown);
        });
    }

    handleItemClick(dropdown, item) {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        const isMultiSelect = menu.classList.contains('dropdown-multi');
        
        if (isMultiSelect) {
            // Multi-select behavior
            item.classList.toggle('selected');
            this.updateMultiSelectDisplay(dropdown);
        } else {
            // Single-select behavior
            menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            
            // Update toggle text
            const text = item.textContent.trim();
            const toggleText = toggle.querySelector('.toggle-text') || toggle;
            toggleText.textContent = text;
            
            // Trigger change event
            this.triggerChangeEvent(dropdown, item);
            
            // Close dropdown
            this.closeDropdown(dropdown);
        }
    }

    updateMultiSelectDisplay(dropdown) {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const selectedItems = dropdown.querySelectorAll('.dropdown-item.selected');
        const toggleText = toggle.querySelector('.toggle-text') || toggle;
        
        if (selectedItems.length === 0) {
            toggleText.textContent = 'Select options...';
        } else if (selectedItems.length === 1) {
            toggleText.textContent = selectedItems[0].textContent.trim();
        } else {
            toggleText.textContent = `${selectedItems.length} selected`;
        }
    }

    filterDropdownItems(dropdown, searchTerm) {
        const items = dropdown.querySelectorAll('.dropdown-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    triggerChangeEvent(dropdown, item) {
        const event = new CustomEvent('dropdownChange', {
            detail: {
                dropdown: dropdown,
                item: item,
                value: item.dataset.value || item.textContent.trim()
            }
        });
        dropdown.dispatchEvent(event);
    }

    // Public methods for programmatic control
    createDropdown(options) {
        const {
            id,
            placeholder = 'Select option...',
            items = [],
            multiSelect = false,
            searchable = false,
            size = 'md', // sm, md, lg
            className = ''
        } = options;

        const dropdown = document.createElement('div');
        dropdown.className = `dropdown dropdown-${size} ${className}`;
        dropdown.id = id;

        const toggle = document.createElement('button');
        toggle.className = 'dropdown-toggle';
        toggle.type = 'button';
        toggle.innerHTML = `
            <span class="toggle-text">${placeholder}</span>
            <svg class="icon" viewBox="0 0 24 24">
                <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
        `;

        const menu = document.createElement('div');
        menu.className = `dropdown-menu ${multiSelect ? 'dropdown-multi' : ''}`;

        if (searchable) {
            const searchDiv = document.createElement('div');
            searchDiv.className = 'dropdown-search';
            searchDiv.innerHTML = '<input type="text" placeholder="Search...">';
            menu.appendChild(searchDiv);
        }

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'dropdown-item';
            itemDiv.textContent = item.text;
            if (item.value) itemDiv.dataset.value = item.value;
            if (item.icon) {
                itemDiv.innerHTML = `<svg class="icon">${item.icon}</svg>${item.text}`;
            }
            menu.appendChild(itemDiv);
        });

        dropdown.appendChild(toggle);
        dropdown.appendChild(menu);
        
        this.setupDropdown(dropdown);
        return dropdown;
    }

    setItems(dropdownId, items) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const menu = dropdown.querySelector('.dropdown-menu');
        const searchDiv = menu.querySelector('.dropdown-search');
        
        // Clear existing items
        menu.innerHTML = '';
        
        // Restore search if it existed
        if (searchDiv) {
            menu.appendChild(searchDiv);
        }

        // Add new items
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'dropdown-item';
            itemDiv.textContent = item.text;
            if (item.value) itemDiv.dataset.value = item.value;
            if (item.icon) {
                itemDiv.innerHTML = `<svg class="icon">${item.icon}</svg>${item.text}`;
            }
            menu.appendChild(itemDiv);
        });

        this.setupDropdown(dropdown);
    }

    getSelectedValue(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return null;

        const selectedItem = dropdown.querySelector('.dropdown-item.selected');
        return selectedItem ? (selectedItem.dataset.value || selectedItem.textContent.trim()) : null;
    }

    getSelectedValues(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return [];

        const selectedItems = dropdown.querySelectorAll('.dropdown-item.selected');
        return Array.from(selectedItems).map(item => 
            item.dataset.value || item.textContent.trim()
        );
    }

    setValue(dropdownId, value) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const items = dropdown.querySelectorAll('.dropdown-item');
        items.forEach(item => {
            const itemValue = item.dataset.value || item.textContent.trim();
            if (itemValue === value) {
                item.classList.add('selected');
                const toggle = dropdown.querySelector('.dropdown-toggle');
                const toggleText = toggle.querySelector('.toggle-text') || toggle;
                toggleText.textContent = item.textContent.trim();
            } else {
                item.classList.remove('selected');
            }
        });
    }

    setLoading(dropdownId, loading) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (loading) {
            dropdown.classList.add('dropdown-loading');
            toggle.disabled = true;
        } else {
            dropdown.classList.remove('dropdown-loading');
            toggle.disabled = false;
        }
    }
}

// Initialize dropdown manager
const dropdownManager = new DropdownManager();

// Export for use in other modules
window.DropdownManager = DropdownManager;
window.dropdownManager = dropdownManager; 