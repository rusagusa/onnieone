document.addEventListener('DOMContentLoaded', () => {
    const csrfToken = document.getElementById('csrfToken').value;

    function showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'show';
        setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
    }

    // Handle text edits
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(el => {
        el.addEventListener('blur', function () {
            const newValue = this.innerText.trim();
            const type = this.getAttribute('data-type');
            const id = this.getAttribute('data-id');
            const field = this.getAttribute('data-field') || 'name_en';
            const key = this.getAttribute('data-key'); // For settings

            const payload = { type, id, field, key, value: newValue };

            fetch('/admin/api/live-edit/text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'CSRF-Token': csrfToken
                },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) showToast('Text saved successfully!');
                })
                .catch(err => console.error('Error saving text:', err));
        });

        // Prevent newlines in tight spots like titles
        el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.blur();
            }
        });
    });

    // Handle image edits
    const imageElements = document.querySelectorAll('.editable-image');
    const uploader = document.getElementById('imageUploader');
    let currentUploadTarget = null;

    imageElements.forEach(img => {
        img.addEventListener('click', function () {
            currentUploadTarget = this;
            uploader.click();
        });
    });

    uploader.addEventListener('change', function (e) {
        if (!this.files || this.files.length === 0) return;
        const file = this.files[0];

        const type = currentUploadTarget.getAttribute('data-type');
        const id = currentUploadTarget.getAttribute('data-id');
        const loc = currentUploadTarget.getAttribute('data-loc'); // For new ads

        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', type);
        if (id) formData.append('id', id);
        if (loc) formData.append('loc', loc);

        // Optimistic UI update
        const reader = new FileReader();
        reader.onload = (e) => {
            if (currentUploadTarget.tagName === 'IMG') {
                currentUploadTarget.src = e.target.result;
            } else {
                // If it was a placeholder div
                currentUploadTarget.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
            }
        }
        reader.readAsDataURL(file);

        fetch('/admin/api/live-edit/image', {
            method: 'POST',
            headers: {
                'CSRF-Token': csrfToken
            },
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showToast('Image updated successfully!');
                    // Wait for DB refresh if needed, but optimistic UI handled it
                    if (data.newId) currentUploadTarget.setAttribute('data-id', data.newId);
                } else {
                    alert('Failed to upload image');
                }
            })
            .catch(err => console.error('Error uploading image:', err));
    });
});
