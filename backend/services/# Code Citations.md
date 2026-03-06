# Code Citations

## License: unknown
https://github.com/Azeem-Haider/Natours/blob/19e66e2510b925a99cd189fc7cf1a29e5fd4328b/public/js/index.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementByI
```


## License: unknown
https://github.com/k-ganda/demo_HealthCost_InsightPro/blob/4384eeff651d6af04aa3586902439ff0d33d457e/frontend/form.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const
```


## License: unknown
https://github.com/beastbybirth/AR-Project/blob/23cbdf8aa8594e9a7318b65e7096e7b68e440b71/public/js/register.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[
```


## License: unknown
https://github.com/Azeem-Haider/Natours/blob/19e66e2510b925a99cd189fc7cf1a29e5fd4328b/public/js/index.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementByI
```


## License: unknown
https://github.com/k-ganda/demo_HealthCost_InsightPro/blob/4384eeff651d6af04aa3586902439ff0d33d457e/frontend/form.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const
```


## License: unknown
https://github.com/beastbybirth/AR-Project/blob/23cbdf8aa8594e9a7318b65e7096e7b68e440b71/public/js/register.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[
```


## License: unknown
https://github.com/Zarhoul/nodejs_app/blob/c3a35804f4110743a4282c97ff7ee4a1389c7408/views/edit.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[0] || null;
            const errorDiv = document.getElementById('error
```


## License: unknown
https://github.com/Azeem-Haider/Natours/blob/19e66e2510b925a99cd189fc7cf1a29e5fd4328b/public/js/index.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementByI
```


## License: unknown
https://github.com/k-ganda/demo_HealthCost_InsightPro/blob/4384eeff651d6af04aa3586902439ff0d33d457e/frontend/form.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const
```


## License: unknown
https://github.com/beastbybirth/AR-Project/blob/23cbdf8aa8594e9a7318b65e7096e7b68e440b71/public/js/register.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[
```


## License: unknown
https://github.com/Zarhoul/nodejs_app/blob/c3a35804f4110743a4282c97ff7ee4a1389c7408/views/edit.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[0] || null;
            const errorDiv = document.getElementById('error
```


## License: unknown
https://github.com/Azeem-Haider/Natours/blob/19e66e2510b925a99cd189fc7cf1a29e5fd4328b/public/js/index.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementByI
```


## License: unknown
https://github.com/k-ganda/demo_HealthCost_InsightPro/blob/4384eeff651d6af04aa3586902439ff0d33d457e/frontend/form.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const
```


## License: unknown
https://github.com/beastbybirth/AR-Project/blob/23cbdf8aa8594e9a7318b65e7096e7b68e440b71/public/js/register.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[
```


## License: unknown
https://github.com/Zarhoul/nodejs_app/blob/c3a35804f4110743a4282c97ff7ee4a1389c7408/views/edit.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[0] || null;
            const errorDiv = document.getElementById('error
```


## License: unknown
https://github.com/Azeem-Haider/Natours/blob/19e66e2510b925a99cd189fc7cf1a29e5fd4328b/public/js/index.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementByI
```


## License: unknown
https://github.com/k-ganda/demo_HealthCost_InsightPro/blob/4384eeff651d6af04aa3586902439ff0d33d457e/frontend/form.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const
```


## License: unknown
https://github.com/beastbybirth/AR-Project/blob/23cbdf8aa8594e9a7318b65e7096e7b68e440b71/public/js/register.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[
```


## License: unknown
https://github.com/Zarhoul/nodejs_app/blob/c3a35804f4110743a4282c97ff7ee4a1389c7408/views/edit.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[0] || null;
            const errorDiv = document.getElementById('error
```


## License: unknown
https://github.com/Azeem-Haider/Natours/blob/19e66e2510b925a99cd189fc7cf1a29e5fd4328b/public/js/index.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const
```


## License: unknown
https://github.com/k-ganda/demo_HealthCost_InsightPro/blob/4384eeff651d6af04aa3586902439ff0d33d457e/frontend/form.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const
```


## License: unknown
https://github.com/beastbybirth/AR-Project/blob/23cbdf8aa8594e9a7318b65e7096e7b68e440b71/public/js/register.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[
```


## License: unknown
https://github.com/Zarhoul/nodejs_app/blob/c3a35804f4110743a4282c97ff7ee4a1389c7408/views/edit.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[0] || null;
            const errorDiv = document.getElementById('error
```


## License: unknown
https://github.com/Azeem-Haider/Natours/blob/19e66e2510b925a99cd189fc7cf1a29e5fd4328b/public/js/index.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[
```


## License: unknown
https://github.com/beastbybirth/AR-Project/blob/23cbdf8aa8594e9a7318b65e7096e7b68e440b71/public/js/register.js

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[
```


## License: unknown
https://github.com/k-ganda/demo_HealthCost_InsightPro/blob/4384eeff651d6af04aa3586902439ff0d33d457e/frontend/form.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[
```


## License: unknown
https://github.com/Zarhoul/nodejs_app/blob/c3a35804f4110743a4282c97ff7ee4a1389c7408/views/edit.html

```
File editing tools are disabled. Here's what you need to add to [frontend/pages/signup.html](frontend/pages/signup.html):

**1. Add payment screenshot field (after the role select, before the button):**
```html
                    <div id="paymentScreenshotContainer" style="display: none;">
                        <label for="paymentScreenshot">Payment Proof (Screenshot)</label>
                        <input type="file" id="paymentScreenshot" name="paymentScreenshot" accept="image/*" required>
                        <small style="display: block; color: #666; margin-top: 5px;">Upload a screenshot of your payment confirmation</small>
                    </div>
```

**2. Update the role label function to show/hide the screenshot field:**
```javascript
        const paymentScreenshotContainer = document.getElementById('paymentScreenshotContainer');
        const paymentScreenshotInput = document.getElementById('paymentScreenshot');

        function updateNameLabel() {
            const selectedRole = roleSelect.value;
            if (selectedRole === 'tutor') {
                nameLabel.textContent = 'Tutorials Group Name';
                nameInput.placeholder = 'Enter your tutorials group name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            } else if (selectedRole === 'student') {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'block';
                paymentScreenshotInput.required = true;
            } else {
                nameLabel.textContent = 'Full Name';
                nameInput.placeholder = 'Enter your full name';
                paymentScreenshotContainer.style.display = 'none';
                paymentScreenshotInput.required = false;
            }
        }
```

**3. Update the form submit handler to capture the file:**
```javascript
        document.querySelector('.login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const paymentScreenshot = document.getElementById('paymentScreenshot').files[0] || null;
            const errorDiv = document.getElementById('error
```

