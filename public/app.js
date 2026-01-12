// State management
let currentNewsletter = null;
let currentPosts = [];
let headerLogoBase64 = null;
let heroImageBase64 = null;

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const editorScreen = document.getElementById('editorScreen');
const newsletterList = document.getElementById('newsletterList');
const newsletterTitle = document.getElementById('newsletterTitle');
const statusBadge = document.getElementById('statusBadge');
const postsList = document.getElementById('postsList');
const doublePostModal = document.getElementById('doublePostModal');
const singlePairModal = document.getElementById('singlePairModal');
const newNewsletterModal = document.getElementById('newNewsletterModal');

// API Base URL
const API_URL = 'http://localhost:3000/api';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadNewsletters();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  // New Newsletter
  document.getElementById('newNewsletterBtn').addEventListener('click', () => {
    showModal('newNewsletterModal');
  });

  document.getElementById('createNewsletterBtn').addEventListener('click', createNewsletter);
  document.getElementById('cancelNewNewsletterBtn').addEventListener('click', () => {
    hideModal('newNewsletterModal');
  });

  // Newsletter Actions
  document.getElementById('saveBtn').addEventListener('click', saveNewsletter);
  document.getElementById('publishBtn').addEventListener('click', togglePublishNewsletter);
  document.getElementById('exportBtn').addEventListener('click', exportHTML);
  document.getElementById('deleteNewsletterBtn').addEventListener('click', deleteNewsletter);
  document.getElementById('duplicateNewsletterBtn').addEventListener('click', duplicateNewsletter);

  // Header Logo Upload
  document.getElementById('headerUpload').addEventListener('change', handleHeaderUpload);

  // Banner Upload
  document.getElementById('bannerUpload').addEventListener('change', handleBannerUpload);

  // Add Posts
  document.getElementById('addDoublePostBtn').addEventListener('click', () => {
    openDoublePostModal();
  });

  document.getElementById('addSinglePairBtn').addEventListener('click', () => {
    openSinglePairModal();
  });

  document.getElementById('addFullWidthPostBtn').addEventListener('click', () => {
    openFullWidthPostModal();
  });

  // Save Double Post
  document.getElementById('saveDoublePostBtn').addEventListener('click', saveDoublePost);

  // Save Single Pair
  document.getElementById('saveSinglePairBtn').addEventListener('click', saveSinglePair);

  // Save Full Width Post
  document.getElementById('saveFullWidthPostBtn').addEventListener('click', saveFullWidthPost);

  // Post Image Previews
  document.getElementById('doublePostImage').addEventListener('change', (e) => handleImagePreview(e, 'doublePostImagePreview'));
  document.getElementById('singlePost1Image').addEventListener('change', (e) => handleImagePreview(e, 'singlePost1ImagePreview'));
  document.getElementById('singlePost2Image').addEventListener('change', (e) => handleImagePreview(e, 'singlePost2ImagePreview'));
  document.getElementById('fullWidthPostImage').addEventListener('change', (e) => handleImagePreview(e, 'fullWidthPostImagePreview'));

  // Stack width sliders
  document.getElementById('doubleStackWidth').addEventListener('input', (e) => {
    document.getElementById('doubleStackWidthValue').textContent = e.target.value;
  });

  document.getElementById('singlePairStackWidth').addEventListener('input', (e) => {
    document.getElementById('singlePairStackWidthValue').textContent = e.target.value;
  });

  // Close modals
  document.querySelectorAll('.close-modal, .cancel-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      hideModal('doublePostModal');
      hideModal('singlePairModal');
      hideModal('fullWidthPostModal');
      hideModal('newNewsletterModal');
    });
  });
}

// Load Newsletters
async function loadNewsletters() {
  try {
    const response = await fetch(`${API_URL}/newsletters`);
    const newsletters = await response.json();

    newsletterList.innerHTML = '';

    newsletters.forEach(newsletter => {
      const item = document.createElement('div');
      item.className = 'newsletter-item';
      if (currentNewsletter && currentNewsletter.id === newsletter.id) {
        item.classList.add('active');
      }
      item.innerHTML = `
        <div class="newsletter-item-title">${newsletter.title}</div>
        <div class="newsletter-item-meta">
          ${newsletter.status} • ${new Date(newsletter.updated_at).toLocaleDateString('it-IT')}
        </div>
      `;
      item.addEventListener('click', () => loadNewsletter(newsletter.id));
      newsletterList.appendChild(item);
    });
  } catch (error) {
    console.error('Errore caricamento newsletter:', error);
  }
}

// Load Single Newsletter
async function loadNewsletter(id) {
  try {
    const response = await fetch(`${API_URL}/newsletters/${id}`);
    const newsletter = await response.json();

    currentNewsletter = newsletter;
    currentPosts = newsletter.posts || [];
    headerLogoBase64 = newsletter.header_logo;
    heroImageBase64 = newsletter.hero_image;

    // Update UI
    welcomeScreen.classList.add('hidden');
    editorScreen.classList.remove('hidden');

    newsletterTitle.value = newsletter.title;
    statusBadge.textContent = newsletter.status;
    statusBadge.className = `status-badge ${newsletter.status}`;

    // Update publish button text based on status
    const publishBtn = document.getElementById('publishBtn');
    if (newsletter.status === 'published') {
      publishBtn.textContent = 'Spubblica';
      publishBtn.className = 'btn btn-warning';
    } else {
      publishBtn.textContent = 'Pubblica';
      publishBtn.className = 'btn btn-success';
    }

    // Header Logo
    if (newsletter.header_logo) {
      headerPreview.innerHTML = `<img src="${newsletter.header_logo}" alt="Header Logo">`;
    } else {
      headerPreview.innerHTML = '';
    }

    // Hero Section
    document.getElementById('heroTitle').value = newsletter.hero_title || '';
    document.getElementById('heroSubtitle').value = newsletter.hero_subtitle || '';

    if (newsletter.hero_image) {
      bannerPreview.innerHTML = `<img src="${newsletter.hero_image}" alt="Hero Image">`;
    } else {
      bannerPreview.innerHTML = '';
    }

    // Footer
    document.getElementById('footerText').value = newsletter.footer_text || '';

    // Posts
    renderPosts();

    // Highlight active newsletter
    loadNewsletters();
  } catch (error) {
    console.error('Errore caricamento newsletter:', error);
  }
}

// Create New Newsletter
// Create New Newsletter
async function createNewsletter() {
  const title = document.getElementById('newNewsletterTitle').value.trim();

  if (!title) {
    alert('Inserisci un titolo');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/newsletters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });

    const newsletter = await response.json();

    hideModal('newNewsletterModal');
    document.getElementById('newNewsletterTitle').value = '';

    // Ricarica la lista delle newsletter prima di aprire quella nuova
    await loadNewsletters();

    loadNewsletter(newsletter.id);
  } catch (error) {
    console.error('Errore creazione newsletter:', error);
  }
}

// Save Newsletter
async function saveNewsletter() {
  if (!currentNewsletter) return;

  try {
    const response = await fetch(`${API_URL}/newsletters/${currentNewsletter.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newsletterTitle.value,
        header_logo: headerLogoBase64,
        hero_title: document.getElementById('heroTitle').value,
        hero_subtitle: document.getElementById('heroSubtitle').value,
        hero_image: heroImageBase64,
        footer_text: document.getElementById('footerText').value,
        status: currentNewsletter.status
      })
    });

    await response.json();
    alert('Newsletter salvata!');
    loadNewsletters();
  } catch (error) {
    console.error('Errore salvataggio newsletter:', error);
  }
}

// Toggle Publish/Unpublish Newsletter
async function togglePublishNewsletter() {
  if (!currentNewsletter) return;

  const isPublished = currentNewsletter.status === 'published';
  const action = isPublished ? 'Spubblicare' : 'Pubblicare';
  const newStatus = isPublished ? 'draft' : 'published';

  if (confirm(`${action} la newsletter?`)) {
    try {
      const response = await fetch(`${API_URL}/newsletters/${currentNewsletter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsletterTitle.value,
          header_logo: headerLogoBase64,
          hero_title: document.getElementById('heroTitle').value,
          hero_subtitle: document.getElementById('heroSubtitle').value,
          hero_image: heroImageBase64,
          footer_text: document.getElementById('footerText').value,
          status: newStatus
        })
      });

      await response.json();

      currentNewsletter.status = newStatus;
      statusBadge.textContent = newStatus;
      statusBadge.className = `status-badge ${newStatus}`;

      // Update button
      const publishBtn = document.getElementById('publishBtn');
      if (newStatus === 'published') {
        publishBtn.textContent = 'Spubblica';
        publishBtn.className = 'btn btn-warning';
      } else {
        publishBtn.textContent = 'Pubblica';
        publishBtn.className = 'btn btn-success';
      }

      loadNewsletters();
    } catch (error) {
      console.error('Errore cambio stato newsletter:', error);
    }
  }
}

// Duplicate Newsletter
async function duplicateNewsletter() {
  if (!currentNewsletter) return;

  if (confirm('Duplicare questa newsletter con tutti i suoi post?')) {
    try {
      const response = await fetch(`${API_URL}/newsletters/${currentNewsletter.id}/duplicate`, {
        method: 'POST'
      });

      const duplicatedNewsletter = await response.json();

      alert(`Newsletter duplicata: "${duplicatedNewsletter.title}"`);

      // Reload newsletters list and open the duplicated one
      await loadNewsletters();
      loadNewsletter(duplicatedNewsletter.id);
    } catch (error) {
      console.error('Errore duplicazione newsletter:', error);
      alert('Errore durante la duplicazione della newsletter');
    }
  }
}

// Delete Newsletter
async function deleteNewsletter() {
  if (!currentNewsletter) return;

  if (confirm('Eliminare questa newsletter?')) {
    try {
      await fetch(`${API_URL}/newsletters/${currentNewsletter.id}`, {
        method: 'DELETE'
      });

      currentNewsletter = null;
      currentPosts = [];
      headerLogoBase64 = null;
      heroImageBase64 = null;

      welcomeScreen.classList.remove('hidden');
      editorScreen.classList.add('hidden');

      loadNewsletters();
    } catch (error) {
      console.error('Errore eliminazione newsletter:', error);
    }
  }
}

// Handle Header Upload
async function handleHeaderUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const base64 = await fileToBase64(file);
  headerLogoBase64 = base64;
  headerPreview.innerHTML = `<img src="${base64}" alt="Header Logo">`;
}

// Handle Banner Upload
async function handleBannerUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const base64 = await fileToBase64(file);
  heroImageBase64 = base64;
  bannerPreview.innerHTML = `<img src="${base64}" alt="Hero Image">`;
}

// Handle Image Preview
async function handleImagePreview(event, previewId) {
  const file = event.target.files[0];
  if (!file) return;

  const base64 = await fileToBase64(file);
  document.getElementById(previewId).innerHTML = `<img src="${base64}" alt="Preview" style="max-width: 200px;">`;
}

// Open Edit Modal
async function openEditModal(postId) {
  const post = currentPosts.find(p => p.id === postId);
  if (!post) return;

  if (post.layout === 'double') {
    document.getElementById('doublePostId').value = post.id;
    document.getElementById('doublePostTitle').value = post.title || '';
    document.getElementById('doublePostContent').value = post.content || '';
    document.getElementById('doublePostImagePreview').innerHTML = post.image ? `<img src="${post.image}" alt="Preview" style="max-width: 200px;">` : '';
    document.getElementById('doubleStackWidth').value = post.stack_width || 50;
    document.getElementById('doubleStackWidthValue').textContent = post.stack_width || 50;
    showModal('doublePostModal');
  } else if (post.layout === 'single-pair') {
    document.getElementById('singlePairPostId').value = post.id;
    document.getElementById('singlePost1Title').value = post.title || '';
    document.getElementById('singlePost1Content').value = post.content || '';
    document.getElementById('singlePost1ImagePreview').innerHTML = post.image ? `<img src="${post.image}" alt="Preview" style="max-width: 200px;">` : '';
    document.getElementById('singlePost2Title').value = post.title2 || '';
    document.getElementById('singlePost2Content').value = post.content2 || '';
    document.getElementById('singlePost2ImagePreview').innerHTML = post.image2 ? `<img src="${post.image2}" alt="Preview" style="max-width: 200px;">` : '';
    document.getElementById('singlePairStackWidth').value = post.stack_width || 50;
    document.getElementById('singlePairStackWidthValue').textContent = post.stack_width || 50;
    showModal('singlePairModal');
  } else if (post.layout === 'full-width') {
    document.getElementById('fullWidthPostId').value = post.id;
    document.getElementById('fullWidthPostTitle').value = post.title || '';
    document.getElementById('fullWidthPostContent').value = post.content || '';
    document.getElementById('fullWidthPostImagePreview').innerHTML = post.image ? `<img src="${post.image}" alt="Preview" style="max-width: 200px;">` : '';
    showModal('fullWidthPostModal');
  }
}

// Open Double Post Modal
function openDoublePostModal() {
  document.getElementById('doublePostId').value = '';
  document.getElementById('doublePostImage').value = '';
  document.getElementById('doublePostTitle').value = '';
  document.getElementById('doublePostContent').value = '';
  document.getElementById('doublePostImagePreview').innerHTML = '';
  document.getElementById('doubleStackWidth').value = 50;
  document.getElementById('doubleStackWidthValue').textContent = 50;
  showModal('doublePostModal');
}

// Open Single Pair Modal
function openSinglePairModal() {
  document.getElementById('singlePairPostId').value = '';
  document.getElementById('singlePost1Image').value = '';
  document.getElementById('singlePost1Title').value = '';
  document.getElementById('singlePost1Content').value = '';
  document.getElementById('singlePost1ImagePreview').innerHTML = '';

  document.getElementById('singlePost2Image').value = '';
  document.getElementById('singlePost2Title').value = '';
  document.getElementById('singlePost2Content').value = '';
  document.getElementById('singlePost2ImagePreview').innerHTML = '';

  document.getElementById('singlePairStackWidth').value = 50;
  document.getElementById('singlePairStackWidthValue').textContent = 50;

  showModal('singlePairModal');
}

// Open Full Width Post Modal
function openFullWidthPostModal() {
  document.getElementById('fullWidthPostId').value = '';
  document.getElementById('fullWidthPostImage').value = '';
  document.getElementById('fullWidthPostTitle').value = '';
  document.getElementById('fullWidthPostContent').value = '';
  document.getElementById('fullWidthPostImagePreview').innerHTML = '';
  showModal('fullWidthPostModal');
}

// Save Double Post
async function saveDoublePost() {
  if (!currentNewsletter) return;

  const postId = document.getElementById('doublePostId').value;
  const imageFile = document.getElementById('doublePostImage').files[0];
  const title = document.getElementById('doublePostTitle').value.trim();
  const content = document.getElementById('doublePostContent').value.trim();
  const stackWidth = parseInt(document.getElementById('doubleStackWidth').value);

  let image = document.querySelector('#doublePostImagePreview img')?.src || null;
  if (imageFile) {
    image = await fileToBase64(imageFile);
  }

  const postData = {
    layout: 'double',
    title,
    content,
    image,
    title2: null,
    content2: null,
    image2: null,
    position: postId ? currentPosts.find(p => p.id == postId).position : currentPosts.length,
    stack_width: stackWidth
  };

  const url = postId ? `${API_URL}/posts/${postId}` : `${API_URL}/newsletters/${currentNewsletter.id}/posts`;
  const method = postId ? 'PUT' : 'POST';

  try {
    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    hideModal('doublePostModal');
    loadNewsletter(currentNewsletter.id);
  } catch (error) {
    console.error('Errore salvataggio post:', error);
  }
}

// Save Single Pair
async function saveSinglePair() {
  if (!currentNewsletter) return;

  const postId = document.getElementById('singlePairPostId').value;

  // Post 1
  const image1File = document.getElementById('singlePost1Image').files[0];
  const title1 = document.getElementById('singlePost1Title').value.trim();
  const content1 = document.getElementById('singlePost1Content').value.trim();

  // Post 2
  const image2File = document.getElementById('singlePost2Image').files[0];
  const title2 = document.getElementById('singlePost2Title').value.trim();
  const content2 = document.getElementById('singlePost2Content').value.trim();

  const stackWidth = parseInt(document.getElementById('singlePairStackWidth').value);

  let image1 = document.querySelector('#singlePost1ImagePreview img')?.src || null;
  if (image1File) {
    image1 = await fileToBase64(image1File);
  }

  let image2 = document.querySelector('#singlePost2ImagePreview img')?.src || null;
  if (image2File) {
    image2 = await fileToBase64(image2File);
  }

  const postData = {
    layout: 'single-pair',
    title: title1,
    content: content1,
    image: image1,
    title2: title2,
    content2: content2,
    image2: image2,
    position: postId ? currentPosts.find(p => p.id == postId).position : currentPosts.length,
    stack_width: stackWidth
  };

  const url = postId ? `${API_URL}/posts/${postId}` : `${API_URL}/newsletters/${currentNewsletter.id}/posts`;
  const method = postId ? 'PUT' : 'POST';

  try {
    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    hideModal('singlePairModal');
    loadNewsletter(currentNewsletter.id);
  } catch (error) {
    console.error('Errore salvataggio coppia post:', error);
  }
}

// Save Full Width Post
async function saveFullWidthPost() {
  if (!currentNewsletter) return;

  const postId = document.getElementById('fullWidthPostId').value;
  const imageFile = document.getElementById('fullWidthPostImage').files[0];
  const title = document.getElementById('fullWidthPostTitle').value.trim();
  const content = document.getElementById('fullWidthPostContent').value.trim();

  let image = document.querySelector('#fullWidthPostImagePreview img')?.src || null;
  if (imageFile) {
    image = await fileToBase64(imageFile);
  }

  const postData = {
    layout: 'full-width',
    title,
    content,
    image,
    title2: null,
    content2: null,
    image2: null,
    position: postId ? currentPosts.find(p => p.id == postId).position : currentPosts.length,
    stack_width: 100
  };

  const url = postId ? `${API_URL}/posts/${postId}` : `${API_URL}/newsletters/${currentNewsletter.id}/posts`;
  const method = postId ? 'PUT' : 'POST';

  try {
    await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });

    hideModal('fullWidthPostModal');
    loadNewsletter(currentNewsletter.id);
  } catch (error) {
    console.error('Errore salvataggio post full-width:', error);
  }
}

// Delete Post
async function deletePost(postId) {
  if (!confirm('Eliminare questo elemento?')) return;

  try {
    await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE'
    });

    loadNewsletter(currentNewsletter.id);
  } catch (error) {
    console.error('Errore eliminazione post:', error);
  }
}

// Move Post Up
async function movePostUp(index) {
  if (index === 0) return;

  const post = currentPosts[index];
  const prevPost = currentPosts[index - 1];

  // Scambia le posizioni
  const tempPosition = post.position;
  post.position = prevPost.position;
  prevPost.position = tempPosition;

  try {
    // Aggiorna entrambi i post
    await fetch(`${API_URL}/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...post })
    });

    await fetch(`${API_URL}/posts/${prevPost.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...prevPost })
    });

    loadNewsletter(currentNewsletter.id);
  } catch (error) {
    console.error('Errore spostamento post:', error);
  }
}

// Move Post Down
async function movePostDown(index) {
  if (index === currentPosts.length - 1) return;

  const post = currentPosts[index];
  const nextPost = currentPosts[index + 1];

  // Scambia le posizioni
  const tempPosition = post.position;
  post.position = nextPost.position;
  nextPost.position = tempPosition;

  try {
    // Aggiorna entrambi i post
    await fetch(`${API_URL}/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...post })
    });

    await fetch(`${API_URL}/posts/${nextPost.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...nextPost })
    });

    loadNewsletter(currentNewsletter.id);
  } catch (error) {
    console.error('Errore spostamento post:', error);
  }
}

// Render Posts
function renderPosts() {
  postsList.innerHTML = '';

  currentPosts.forEach((post, index) => {
    const card = document.createElement('div');
    card.className = 'post-card';

    const leftWidth = post.stack_width || 50;
    const rightWidth = 100 - leftWidth;
    const isCustomWidth = leftWidth !== 50;

    if (post.layout === 'double') {
      card.innerHTML = `
        <div class="post-position">${index + 1}</div>
        <div class="post-card-header">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="post-layout-badge">Doppia Colonna</span>
            ${isCustomWidth ? `<span class="post-layout-badge" style="background: #17a2b8; font-size: 12px;">${leftWidth}% / ${rightWidth}%</span>` : ''}
          </div>
          <div class="post-actions">
            <button class="btn btn-secondary" onclick="movePostUp(${index})" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-secondary" onclick="movePostDown(${index})" ${index === currentPosts.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn btn-secondary" onclick="openEditModal(${post.id})">Modifica</button>
            <button class="btn btn-danger" onclick="deletePost(${post.id})">Elimina</button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: ${leftWidth}% ${rightWidth}%; gap: 20px; align-items: start;">
          <div>
            ${post.image ? `<img src="${post.image}" style="width: 100%; border-radius: 6px;" alt="Post image">` : '<div style="width: 100%; height: 150px; background: #ddd; border-radius: 6px; display: flex; align-items: center; justify-content: center;">Nessuna immagine</div>'}
          </div>
          <div>
            <h4>${post.title || 'Senza titolo'}</h4>
            <div class="post-card-content">${post.content || ''}</div>
          </div>
        </div>
      `;
    } else if (post.layout === 'single-pair') {
      card.innerHTML = `
        <div class="post-position">${index + 1}</div>
        <div class="post-card-header">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="post-layout-badge">Coppia Post Singoli</span>
            ${isCustomWidth ? `<span class="post-layout-badge" style="background: #17a2b8; font-size: 12px;">${leftWidth}% / ${rightWidth}%</span>` : ''}
          </div>
          <div class="post-actions">
            <button class="btn btn-secondary" onclick="movePostUp(${index})" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-secondary" onclick="movePostDown(${index})" ${index === currentPosts.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn btn-secondary" onclick="openEditModal(${post.id})">Modifica</button>
            <button class="btn btn-danger" onclick="deletePost(${post.id})">Elimina</button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: ${leftWidth}% ${rightWidth}%; gap: 20px;">
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
            ${post.image ? `<img src="${post.image}" style="width: 100%; margin: 10px 0; border-radius: 6px;" alt="Post 1">` : ''}
            <h4 style="margin: 10px 0 5px 0;">${post.title || 'Senza titolo'}</h4>
            <div style="font-size: 14px; color: #555;">${post.content || ''}</div>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
            ${post.image2 ? `<img src="${post.image2}" style="width: 100%; margin: 10px 0; border-radius: 6px;" alt="Post 2">` : ''}
            <h4 style="margin: 10px 0 5px 0;">${post.title2 || 'Senza titolo'}</h4>
            <div style="font-size: 14px; color: #555;">${post.content2 || ''}</div>
          </div>
        </div>
      `;
    } else if (post.layout === 'full-width') {
      card.innerHTML = `
        <div class="post-position">${index + 1}</div>
        <div class="post-card-header">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="post-layout-badge">Full Width</span>
          </div>
          <div class="post-actions">
            <button class="btn btn-secondary" onclick="movePostUp(${index})" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-secondary" onclick="movePostDown(${index})" ${index === currentPosts.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn btn-secondary" onclick="openEditModal(${post.id})">Modifica</button>
            <button class="btn btn-danger" onclick="deletePost(${post.id})">Elimina</button>
          </div>
        </div>
        <div style="display: block;">
          ${post.image ? `<img src="${post.image}" style="width: 100%; border-radius: 6px; margin-bottom: 15px;" alt="Post image">` : ''}
          <h4>${post.title || 'Senza titolo'}</h4>
          <div class="post-card-content">${post.content || ''}</div>
        </div>
      `;
    }

    postsList.appendChild(card);
  });
}



// Export HTML
async function exportHTML() {
  const html = generateNewsletterHTML();

  try {
    const response = await fetch(`${API_URL}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    });

    if (response.ok) {
      alert('File export.html generato con successo!');
    } else {
      alert('Errore durante la generazione del file HTML.');
    }
  } catch (error) {
    console.error('Errore esportazione HTML:', error);
    alert('Errore durante la generazione del file HTML.');
  }
}

// Generate Newsletter HTML
function generateNewsletterHTML() {
  let postsHTML = '';

  currentPosts.forEach(post => {
    const leftWidth = post.stack_width || 50;
    const rightWidth = 100 - leftWidth;

    if (post.layout === 'double') {
      // Post doppia colonna: immagine sinistra, testo destra
      postsHTML += `
            <!-- Post Doppia Colonna -->
            <tr>
              <td class="p16 two-columns">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td class="stack" width="${leftWidth}%" valign="top">
                      ${post.image ? `<img src="${post.image}" class="column-img" style="width:100%; height:auto; display:block;">` : ''}
                    </td>
                    <td class="stack" width="${rightWidth}%" valign="top" style="padding-left: 12px;">
                      <div class="column-title">${post.title || ''}</div>
                      <div class="column-text">${post.content || ''}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
      `;
    } else if (post.layout === 'single-pair') {
      // Coppia post singoli affiancati
      postsHTML += `
            <!-- Coppia Post Singoli -->
            <tr>
              <td class="p16 two-columns">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td class="stack" width="${leftWidth}%" valign="top">
                      ${post.image ? `<img src="${post.image}" class="column-img" style="width:100%; height:auto; display:block;">` : ''}
                      <div class="column-title">${post.title || ''}</div>
                      <div class="column-text">${post.content || ''}</div>
                    </td>
                    <td class="stack" width="${rightWidth}%" valign="top" style="padding-left: 12px;">
                      ${post.image2 ? `<img src="${post.image2}" class="column-img" style="width:100%; height:auto; display:block;">` : ''}
                      <div class="column-title">${post.title2 || ''}</div>
                      <div class="column-text">${post.content2 || ''}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
      `;
    } else if (post.layout === 'full-width') {
      // Post full width: immagine e testo a larghezza intera
      postsHTML += `
            <!-- Post Full Width -->
            <tr>
              <td class="full-width-article" style="padding:0 24px 24px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td valign="top">
                      ${post.image ? `<img src="${post.image}" width="552" height="300" alt="${post.title || 'Articolo'}" class="full-width-img" style="width:100%; height:auto; display:block;">` : ''}
                      <div class="full-width-title" style="font-family:Arial,Helvetica,sans-serif; font-size:20px; line-height:1.35; color:#111111; padding-top:12px; font-weight:bold;">${post.title || ''}</div>
                      <div class="full-width-text" style="font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.55; color:#333333; padding-top:8px; text-align:justify;">${post.content || ''}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
      `;
    }
  });

  const heroTitle = document.getElementById('heroTitle').value || '';
  const heroSubtitle = document.getElementById('heroSubtitle').value || '';
  const footerText = document.getElementById('footerText').value || '';

  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Newsletter</title>
  <style>
    /* General styles */
    body { margin:0; padding:0; background:#f5f7fb; }
    .center-role { width:100%; background:#f5f7fb; }
    .container { width:600px; max-width:600px; background:#ffffff; }
    .header { padding:20px 24px; text-align:left; }
    .logo { display:block; border:0; outline:none; }
    .hero { padding:0 24px 16px 24px; }
    .hero-img { width:100%; height:auto; display:block; }
    .title { padding:0 24px 8px 24px; font-family:Arial,Helvetica,sans-serif; font-size:22px; line-height:1.3; color:#111111; }
    .text { padding:0 24px 16px 24px; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.55; color:#333333; text-align: justify; }
    .two-columns { padding:0 24px 24px 24px; }
    .column { padding-right:12px; }
    .column-img { width:100%; height:auto; display:block; }
    .column-title { font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.4; color:#111; padding-top:8px; font-weight: bold;}
    .column-text { font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5; color:#555; padding-top:6px; text-align: justify;}
    .footer { padding:20px 24px 28px 24px; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:1.5; color:#666; background:#f8f9fc; }
    .footer-copy { color:#999; }
    .p16 { padding: 16px; }
    .stack { display: table-cell; }

    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .stack { display: block !important; width: 100% !important; }
      .p16 { padding:16px !important; }
    }
  </style>
</head>
<body class="body">
  <center role="article" aria-roledescription="email" lang="it" class="center-role">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container">
            <!-- Header -->
            <tr>
              <td class="header">
                ${headerLogoBase64 ? `<img src="${headerLogoBase64}" class="logo" alt="Logo" style="max-width: 200px;">` : ''}
              </td>
            </tr>
            <!-- Hero -->
            <tr>
              <td class="hero">
                ${heroImageBase64 ? `<img src="${heroImageBase64}" class="hero-img" alt="Hero">` : ''}
              </td>
            </tr>
            ${heroTitle ? `<tr><td class="title">${heroTitle}</td></tr>` : ''}
            ${heroSubtitle ? `<tr><td class="text">${heroSubtitle}</td></tr>` : ''}

            ${postsHTML}

            <!-- Footer -->
            <tr>
              <td class="footer">
                ${footerText}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

// Utility Functions
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}
