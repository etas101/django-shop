document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('product-list');
    const spinner = document.getElementById('loading-spinner');

    // 1. Функция загрузки товаров с API
    async function loadProducts(searchQuery = '') {
        try {
            spinner.style.display = 'block';
            productList.innerHTML = ''; // Очищаем список перед загрузкой

            // Добавляем параметр поиска, если он есть
            const url = searchQuery ? `/api/products/?search=${encodeURIComponent(searchQuery)}` : '/api/products/';
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Ошибка загрузки данных с сервера');
            
            const products = await response.json();
            
            if (products.length === 0) {
                productList.innerHTML = '<p class="text-center">Товары не найдены.</p>';
                return;
            }

            // Генерируем HTML одним махом
            productList.innerHTML = products.map(product => `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-muted">${product.price} ₽</p>
                            <div class="mt-auto">
                                <a href="/catalog/${product.id}/" class="btn btn-outline-primary w-100 mb-2">Подробнее</a>
                                <button class="btn btn-success w-100 add-to-cart" data-id="${product.id}">
                                    В корзину
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error(error);
            productList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger text-center">
                        Не удалось загрузить товары: ${error.message}
                    </div>
                </div>`;
        } finally {
            spinner.style.display = 'none';
        }
    }

    // 2. Делегирование событий: клики на кнопки
    productList.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            addToCart(e.target.dataset.id);
        }
    });

    // 3. Обработка формы поиска
    const filterForm = document.getElementById('filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('search-input').value;
            loadProducts(query);
        });
    }

    // 4. Функция добавления в корзину
    async function addToCart(productId) {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        const csrftoken = csrfInput ? csrfInput.value : '';
        
        try {
            const response = await fetch('/api/cart/add/', {
                method: 'POST',
                headers: { 
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ product_id: productId })
            });

            if (response.ok) {
                showToast('Товар успешно добавлен в корзину!', 'success');
            } else {
                throw new Error('Ошибка при добавлении в корзину');
            }
        } catch (error) {
            showToast(error.message, 'danger');
        }
    }

    // 5. Уведомления
    function showToast(message, type) {
        const toastContainer = document.getElementById('toast-container');
        toastContainer.innerHTML = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>`;
        const toastElement = new bootstrap.Toast(toastContainer.querySelector('.toast'));
        toastElement.show();
    }

    loadProducts();
});