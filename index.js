document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const languageFilter = document.getElementById('language-filter');
    const sortFilter = document.getElementById('sort-filter');
    const resultsContainer = document.getElementById('results-container');
    const loadingElement = document.getElementById('loading');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');

    let currentPage = 1;
    let currentQuery = '';
    let totalCount = 0;
    const perPage = 9;

    // Event listeners
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    languageFilter.addEventListener('change', performSearch);
    sortFilter.addEventListener('change', performSearch);
    prevBtn.addEventListener('click', goToPreviousPage);
    nextBtn.addEventListener('click', goToNextPage);

    async function performSearch() {
        currentQuery = searchInput.value.trim();
        if (!currentQuery) {
            alert('Please enter a search term');
            return;
        }

        currentPage = 1;
        await fetchRepositories();
    }

    async function fetchRepositories() {
        try {
            showLoading();
            clearResults();

            const language = languageFilter.value;
            const sort = sortFilter.value;
            const order = sort === 'updated' ? 'desc' : 'desc'; // GitHub API requires order with sort

            let query = `${currentQuery}`;
            if (language) {
                query += `+language:${language}`;
            }

            const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&page=${currentPage}&per_page=${perPage}`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            totalCount = data.total_count;
            displayResults(data.items);
            updatePagination();

        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    function displayResults(repositories) {
        if (repositories.length === 0) {
            resultsContainer.innerHTML = '<div class="error-message">No repositories found. Try a different search.</div>';
            return;
        }

        repositories.forEach(repo => {
            const repoCard = document.createElement('div');
            repoCard.className = 'repo-card';

            const starsCount = formatNumber(repo.stargazers_count);
            const forksCount = formatNumber(repo.forks_count);
            const updatedDate = new Date(repo.updated_at).toLocaleDateString();

            repoCard.innerHTML = `
                <h2 class="repo-name"><a href="${repo.html_url}" target="_blank">${repo.full_name}</a></h2>
                <p class="repo-description">${repo.description || 'No description provided.'}</p>
                <div class="repo-meta">
                    <span><i class="fas fa-star"></i> ${starsCount}</span>
                    <span><i class="fas fa-code-branch"></i> ${forksCount}</span>
                    <span><i class="fas fa-circle" style="color: ${repo.language ? getLanguageColor(repo.language) : '#ccc'}"></i> ${repo.language || 'N/A'}</span>
                    <span><i class="fas fa-calendar-alt"></i> ${updatedDate}</span>
                </div>
            `;

            resultsContainer.appendChild(repoCard);
        });
    }

    function clearResults() {
        resultsContainer.innerHTML = '';
    }

    function showLoading() {
        loadingElement.style.display = 'flex';
    }

    function hideLoading() {
        loadingElement.style.display = 'none';
    }

    function showError(message) {
        resultsContainer.innerHTML = `<div class="error-message">Error: ${message}</div>`;
    }

    function updatePagination() {
        pageInfo.textContent = `Page ${currentPage}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = (currentPage * perPage) >= totalCount;
    }

    function goToPreviousPage() {
        if (currentPage > 1) {
            currentPage--;
            fetchRepositories();
        }
    }

    function goToNextPage() {
        if ((currentPage * perPage) < totalCount) {
            currentPage++;
            fetchRepositories();
        }
    }

    function formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    function getLanguageColor(language) {
        // Simple color mapping - you could expand this with more languages
        const colors = {
            'JavaScript': '#f1e05a',
            'Python': '#3572A5',
            'Java': '#b07219',
            'C#': '#178600',
            'PHP': '#4F5D95',
            'Ruby': '#701516',
            'TypeScript': '#2b7489',
            'Go': '#00ADD8',
            'Swift': '#ffac45',
            'Kotlin': '#F18E33'
        };
        return colors[language] || '#ccc';
    }
});