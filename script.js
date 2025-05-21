// Variáveis globais
const API_BASE_URL = 'https://pokeapi.co/api/v2';
let currentPage = 1;
const limit = 20;
let totalPages = 0;
let allPokemon = [];
let filteredPokemon = [];
let activeTypeFilter = 'all';
let activeSearchTerm = '';
let totalPokemonCount = 0;

// Elementos DOM
const pokemonGrid = document.getElementById('pokemon-grid');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const modal = document.getElementById('pokemon-modal');
const closeModal = document.getElementById('close-modal');
const pokemonDetail = document.getElementById('pokemon-detail');
const spinner = document.getElementById('spinner');
const errorMessage = document.getElementById('error-message');
const typeFilters = document.getElementById('type-filters');
const resetFiltersBtn = document.getElementById('reset-filters');

// Tipos Pokémon com ícones correspondentes
const pokemonTypes = [
    { name: 'all', label: 'Todos', icon: 'fa-list' },
    { name: 'normal', label: 'Normal', icon: 'fa-circle', color: 'var(--type-normal)' },
    { name: 'fire', label: 'Fogo', icon: 'fa-fire', color: 'var(--type-fire)' },
    { name: 'water', label: 'Água', icon: 'fa-tint', color: 'var(--type-water)' },
    { name: 'grass', label: 'Grama', icon: 'fa-leaf', color: 'var(--type-grass)' },
    { name: 'electric', label: 'Elétrico', icon: 'fa-bolt', color: 'var(--type-electric)' },
    { name: 'ice', label: 'Gelo', icon: 'fa-snowflake', color: 'var(--type-ice)' },
    { name: 'fighting', label: 'Lutador', icon: 'fa-hand-fist', color: 'var(--type-fighting)' },
    { name: 'poison', label: 'Veneno', icon: 'fa-skull-crossbones', color: 'var(--type-poison)' },
    { name: 'ground', label: 'Terra', icon: 'fa-mountain', color: 'var(--type-ground)' },
    { name: 'flying', label: 'Voador', icon: 'fa-dove', color: 'var(--type-flying)' },
    { name: 'psychic', label: 'Psíquico', icon: 'fa-brain', color: 'var(--type-psychic)' },
    { name: 'bug', label: 'Inseto', icon: 'fa-bug', color: 'var(--type-bug)' },
    { name: 'rock', label: 'Pedra', icon: 'fa-hill-rockslide', color: 'var(--type-rock)' },
    { name: 'ghost', label: 'Fantasma', icon: 'fa-ghost', color: 'var(--type-ghost)' },
    { name: 'dragon', label: 'Dragão', icon: 'fa-dragon', color: 'var(--type-dragon)' },
    { name: 'dark', label: 'Sombrio', icon: 'fa-moon', color: 'var(--type-dark)' },
    { name: 'steel', label: 'Aço', icon: 'fa-shield', color: 'var(--type-steel)' },
    { name: 'fairy', label: 'Fada', icon: 'fa-wand-magic-sparkles', color: 'var(--type-fairy)' }
];

// Inicializar app
document.addEventListener('DOMContentLoaded', () => {
    createTypeFilters();
    fetchTotalPokemonCount().then(() => {
        fetchPokemonList();
        setupEventListeners();
    });
});

// Criar botões de filtro por tipo
function createTypeFilters() {
    typeFilters.innerHTML = pokemonTypes.map(type => `
        <button class="filter-btn ${type.name === 'all' ? 'active' : ''}" data-type="${type.name}">
            <i class="fas ${type.icon}" style="color: ${type.color || 'inherit'}"></i> ${type.label}
        </button>
    `).join('');
}

// Buscar o total de Pokémon disponíveis
async function fetchTotalPokemonCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/pokemon?limit=1`);
        const data = await response.json();
        totalPokemonCount = data.count;
    } catch (error) {
        console.error('Erro ao buscar contagem total de Pokémon:', error);
        totalPokemonCount = 1302; // Valor padrão caso a API falhe
    }
}

// Configurar event listeners
function setupEventListeners() {
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchPokemonList();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchPokemonList();
        }
    });

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Filtros por tipo
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type;
            activeTypeFilter = type;
            
            // Atualizar estado ativo dos botões
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            applyFilters();
        });
    });

    // Resetar filtros
    resetFiltersBtn.addEventListener('click', () => {
        activeTypeFilter = 'all';
        activeSearchTerm = '';
        searchInput.value = '';
        
        // Atualizar estado ativo dos botões
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.filter-btn[data-type="all"]').classList.add('active');
        
        fetchPokemonList();
    });
}

        // Buscar lista de Pokémon
        async function fetchPokemonList() {
            showSpinner();
            errorMessage.style.display = 'none';
            pokemonGrid.innerHTML = '';

            try {
                const offset = (currentPage - 1) * limit;
                const response = await fetch(`${API_BASE_URL}/pokemon?offset=${offset}&limit=${limit}`);
                
                if (!response.ok) {
                    throw new Error('Erro ao carregar Pokémon');
                }
                
                const data = await response.json();

                totalPages = Math.ceil(totalPokemonCount / limit);
                updatePaginationButtons();

                // Buscar detalhes de cada Pokémon
                const pokemonPromises = data.results.map(pokemon => 
                    fetch(pokemon.url).then(res => {
                        if (!res.ok) throw new Error('Erro ao carregar Pokémon');
                        return res.json();
                    })
                );
                
                const pokemonData = await Promise.all(pokemonPromises);
                allPokemon = pokemonData;
                filteredPokemon = pokemonData;

                renderPokemonCards(pokemonData);
                hideSpinner();
            } catch (error) {
                console.error('Erro ao buscar Pokémon:', error);
                showError();
                hideSpinner();
            }
        }

        // Buscar todos os Pokémon de um tipo específico
        async function fetchPokemonByType(type) {
            showSpinner();
            errorMessage.style.display = 'none';
            pokemonGrid.innerHTML = '';

            try {
                const response = await fetch(`${API_BASE_URL}/type/${type}`);
                
                if (!response.ok) {
                    throw new Error('Erro ao carregar tipo');
                }
                
                const data = await response.json();
                
                // Limitar a 100 Pokémon para não sobrecarregar a API
                const pokemonList = data.pokemon.slice(0, 100).map(item => item.pokemon);
                
                // Buscar detalhes de cada Pokémon
                const pokemonPromises = pokemonList.map(pokemon => 
                    fetch(pokemon.url).then(res => {
                        if (!res.ok) throw new Error('Erro ao carregar Pokémon');
                        return res.json();
                    })
                );
                
                const pokemonData = await Promise.all(pokemonPromises);
                allPokemon = pokemonData;
                filteredPokemon = pokemonData;

                renderPokemonCards(pokemonData);
                hideSpinner();
                
                // Desativar paginação quando filtro por tipo está ativo
                prevButton.disabled = true;
                nextButton.disabled = true;
            } catch (error) {
                console.error('Erro ao buscar Pokémon por tipo:', error);
                showError();
                hideSpinner();
            }
        }

        // Renderizar cards de Pokémon
        function renderPokemonCards(pokemonList) {
            pokemonGrid.innerHTML = '';
            errorMessage.style.display = 'none';

            if (pokemonList.length === 0) {
                showError();
                return;
            }

            pokemonList.forEach(pokemon => {
                const card = createPokemonCard(pokemon);
                pokemonGrid.appendChild(card);
            });
        }

        function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.classList.add('pokemon-card');
    card.addEventListener('click', () => showPokemonDetails(pokemon.id));

    // Obter a imagem do Pokémon
    const imageUrl = pokemon.sprites.other?.['official-artwork']?.front_default || 
                    pokemon.sprites.front_default || 
                    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;

    // Obter os tipos
    const types = pokemon.types.map(typeInfo => ({
        name: typeInfo.type.name,
        class: typeInfo.type.name
    }));

    // Definir cores baseadas no tipo primário
    const primaryType = types[0].class;
    const typeColor = `var(--type-${primaryType})`;
    
    // Aplicar estilos diretamente no card
    card.style.borderColor = typeColor;
    card.style.setProperty('--type-color', typeColor); // Para uso no CSS

    card.innerHTML = `
        <img src="${imageUrl}" alt="${pokemon.name}" loading="lazy">
        <div class="pokemon-info">
            <div class="pokemon-id">#${pokemon.id.toString().padStart(3, '0')}</div>
            <h3 class="pokemon-name">${pokemon.name}</h3>
            <div class="pokemon-types">
                ${types.map(type => `<span class="type ${type.class}">${type.name}</span>`).join('')}
            </div>
        </div>
    `;

    return card;
}

        // Atualizar botões de paginação
        function updatePaginationButtons() {
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage === totalPages;
        }

        // Mostrar detalhes do Pokémon
        async function showPokemonDetails(pokemonId) {
            showSpinner();
            pokemonDetail.innerHTML = '';

            try {
                const response = await fetch(`${API_BASE_URL}/pokemon/${pokemonId}`);
                
                if (!response.ok) {
                    throw new Error('Pokémon não encontrado');
                }
                
                const pokemon = await response.json();

                // Obter o tipo primário do Pokémon
        const primaryType = pokemon.types[0].type.name;
        const typeColor = `var(--type-${primaryType})`;
        
        // Aplicar a cor do tipo ao modal
        pokemonDetail.style.setProperty('--type-color', typeColor);

                // Obter a imagem do Pokémon
                const imageUrl = pokemon.sprites.other?.['official-artwork']?.front_default || 
                                pokemon.sprites.front_default || 
                                `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;

                // Obter os tipos
                const types = pokemon.types.map(typeInfo => ({
                    name: typeInfo.type.name,
                    class: typeInfo.type.name
                }));

                // Formatar estatísticas
                const stats = pokemon.stats.map(stat => ({
                    name: stat.stat.name.replace('-', ' '),
                    value: stat.base_stat,
                    percentage: (stat.base_stat / 255) * 100
                }));

                // Obter habilidades
                const abilities = pokemon.abilities.map(ability => 
                    ability.ability.name.replace('-', ' ')
                ).join(', ');

                // Mapear ícones para estatísticas
                const statIcons = {
                    hp: 'fa-heart',
                    attack: 'fa-bolt',
                    defense: 'fa-shield',
                    'special attack': 'fa-fire',
                    'special defense': 'fa-shield-halved',
                    speed: 'fa-gauge-high'
                };

                // Criar o conteúdo HTML para o modal
                pokemonDetail.innerHTML = `
                    <img src="${imageUrl}" alt="${pokemon.name}">
                    <h2>
                        ${pokemon.name}
                        <span class="pokemon-detail-id">#${pokemon.id.toString().padStart(3, '0')}</span>
                    </h2>
                    <div class="detail-types">
                        ${types.map(type => `<span class="type ${type.class}">${type.name}</span>`).join('')}
                    </div>
                    
                    <div class="pokemon-info-additional">
                        <div class="info-box">
                            <h4><i class="fas fa-ruler-vertical"></i> Altura</h4>
                            <p>${pokemon.height / 10} m</p>
                        </div>
                        <div class="info-box">
                            <h4><i class="fas fa-weight-scale"></i> Peso</h4>
                            <p>${pokemon.weight / 10} kg</p>
                        </div>
                        <div class="info-box">
                            <h4><i class="fas fa-star"></i> Habilidades</h4>
                            <p>${abilities}</p>
                        </div>
                        <div class="info-box">
                            <h4><i class="fas fa-arrow-up-from-bracket"></i> Experiência Base</h4>
                            <p>${pokemon.base_experience} XP</p>
                        </div>
                    </div>
                    
                    <div class="stats">
                        <h3>Estatísticas</h3>
                        ${stats.map(stat => `
                            <div class="stat-item">
                                <div class="stat-name">
                                    <i class="fas ${statIcons[stat.name] || 'fa-circle-info'} stat-icon"></i>
                                    ${stat.name}
                                </div>
                                <div class="stat-bar-container">
                                    <div class="stat-bar">
                                        <div class="stat-value" style="width: ${stat.percentage}%"></div>
                                    </div>
                                    <div class="stat-number">${stat.value}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;

                modal.style.display = 'flex';
                hideSpinner();
            } catch (error) {
                console.error('Erro ao buscar detalhes do Pokémon:', error);
                hideSpinner();
                pokemonDetail.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Ocorreu um erro ao carregar os detalhes deste Pokémon.
                    </div>
                `;
            }
        }

        // Buscar Pokémon pelo nome ou ID
        async function handleSearch() {
            const searchTerm = searchInput.value.trim().toLowerCase();
            activeSearchTerm = searchTerm;
            
            if (!searchTerm) {
                activeSearchTerm = '';
                applyFilters();
                return;
            }

            showSpinner();
            errorMessage.style.display = 'none';
            pokemonGrid.innerHTML = '';

            try {
                // Primeiro tentamos buscar exatamente pelo termo (pode ser ID ou nome)
                try {
                    const response = await fetch(`${API_BASE_URL}/pokemon/${searchTerm}`);
                    
                    if (!response.ok) {
                        throw new Error('Pokémon não encontrado');
                    }

                    const pokemon = await response.json();
                    filteredPokemon = [pokemon];
                    renderPokemonCards(filteredPokemon);
                    
                    // Desativar paginação durante a busca
                    prevButton.disabled = true;
                    nextButton.disabled = true;
                    
                    hideSpinner();
                    return;
                } catch (exactError) {
                    console.log('Busca exata não encontrada, tentando busca parcial');
                }

                // Se não encontrou exato, fazemos uma busca parcial na lista existente
                const filtered = allPokemon.filter(pokemon => 
                    pokemon.name.toLowerCase().includes(searchTerm) || 
                    pokemon.id.toString().includes(searchTerm)
                );

                if (filtered.length > 0) {
                    filteredPokemon = filtered;
                    renderPokemonCards(filteredPokemon);
                    
                    // Desativar paginação durante a busca
                    prevButton.disabled = true;
                    nextButton.disabled = true;
                } else {
                    throw new Error('Nenhum Pokémon encontrado');
                }
                
                hideSpinner();
            } catch (error) {
                console.error('Erro na busca:', error);
                pokemonGrid.innerHTML = '';
                showError();
                hideSpinner();
            }
        }

        // Aplicar filtros (tipo e busca)
        function applyFilters() {
            // Se o filtro de tipo estiver ativo, buscar todos os Pokémon desse tipo
            if (activeTypeFilter !== 'all') {
                fetchPokemonByType(activeTypeFilter);
                return;
            }
            
            // Caso contrário, aplicar apenas a busca (se houver)
            let filtered = [...allPokemon];
            
            if (activeSearchTerm) {
                filtered = filtered.filter(pokemon => 
                    pokemon.name.toLowerCase().includes(activeSearchTerm) || 
                    pokemon.id.toString().includes(activeSearchTerm)
                );
            }
            
            filteredPokemon = filtered;
            renderPokemonCards(filteredPokemon);
            
            // Ativar/desativar paginação conforme necessário
            const hasFilters = activeSearchTerm !== '';
            prevButton.disabled = hasFilters || currentPage === 1;
            nextButton.disabled = hasFilters || currentPage === totalPages;
        }

        // Utilitários para o spinner e mensagens de erro
        function showSpinner() {
            spinner.style.display = 'block';
        }

        function hideSpinner() {
            spinner.style.display = 'none';
        }

        function showError() {
            errorMessage.style.display = 'block';
        }