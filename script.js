/* ==================================================================================
   POKÉDEX MODERNA - SCRIPT JAVASCRIPT PRINCIPAL
   ================================================================================== */

/* --------------------------------------------------------------------------------
   VARIÁVEIS GLOBAIS - CONFIGURAÇÕES E ESTADO DA APLICAÇÃO
   -------------------------------------------------------------------------------- */

// URL base da API Pokémon
const API_BASE_URL = 'https://pokeapi.co/api/v2';

// Controle de paginação
let currentPage = 1;
const limit = 20;
let totalPages = 0;
let totalPokemonCount = 0;

// Arrays para armazenamento de dados
let allPokemon = [];
let filteredPokemon = [];

// Estados dos filtros ativos
let activeTypeFilter = 'all';
let activeSearchTerm = '';

/* --------------------------------------------------------------------------------
   ELEMENTOS DOM - REFERÊNCIAS DOS ELEMENTOS HTML
   -------------------------------------------------------------------------------- */

// Grid principal e controles de paginação
const pokemonGrid = document.getElementById('pokemon-grid');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');

// Elementos de pesquisa
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Modal de detalhes
const modal = document.getElementById('pokemon-modal');
const closeModal = document.getElementById('close-modal');
const pokemonDetail = document.getElementById('pokemon-detail');

// Estados de carregamento e erro
const spinner = document.getElementById('spinner');
const errorMessage = document.getElementById('error-message');

// Filtros por tipo
const typeFilters = document.getElementById('type-filters');
const resetFiltersBtn = document.getElementById('reset-filters');

/* ==================================================================================
   DEFINIÇÕES DE TIPOS POKÉMON
   ================================================================================== */

/* --------------------------------------------------------------------------------
   TIPOS POKÉMON COM ÍCONES CORRESPONDENTES
   -------------------------------------------------------------------------------- */

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

/* ==================================================================================
   INICIALIZAÇÃO DA APLICAÇÃO
   ================================================================================== */ 

/* --------------------------------------------------------------------------------
   INICIALIZAR APP - PONTO DE ENTRADA PRINCIPAL
   -------------------------------------------------------------------------------- */

// Aguardar o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    createTypeFilters();
    fetchTotalPokemonCount().then(() => {
        fetchPokemonList();
        setupEventListeners();
    });
});

/* ==================================================================================
   SEÇÃO DE FILTROS POR TIPO
   ================================================================================== */

/* --------------------------------------------------------------------------------
   CRIAR BOTÕES DE FILTRO POR TIPO
   -------------------------------------------------------------------------------- */

function createTypeFilters() {
    typeFilters.innerHTML = pokemonTypes.map(type => `
        <button class="filter-btn ${type.name === 'all' ? 'active' : ''}" data-type="${type.name}">
            <i class="fas ${type.icon}" style="color: ${type.color || 'inherit'}"></i> ${type.label}
        </button>
    `).join('');
}

/* ==================================================================================
   SEÇÃO DE REQUISIÇÕES À API
   ================================================================================== */

/* --------------------------------------------------------------------------------
   BUSCAR O TOTAL DE POKÉMON DISPONÍVEIS
   -------------------------------------------------------------------------------- */

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

/* --------------------------------------------------------------------------------
   BUSCAR LISTA DE POKÉMON - FUNÇÃO PRINCIPAL DE CARREGAMENTO
   -------------------------------------------------------------------------------- */

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

/* --------------------------------------------------------------------------------
   BUSCAR TODOS OS POKÉMON DE UM TIPO ESPECÍFICO
   -------------------------------------------------------------------------------- */

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

/* ==================================================================================
   SEÇÃO DE RENDERIZAÇÃO DOS POKÉMON
   ================================================================================== */

/* --------------------------------------------------------------------------------
   RENDERIZAR CARDS DE POKÉMON - FUNÇÃO PRINCIPAL DE EXIBIÇÃO
   -------------------------------------------------------------------------------- */

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

/* --------------------------------------------------------------------------------
   CRIAR CARD INDIVIDUAL DO POKÉMON
   -------------------------------------------------------------------------------- */

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



/* ==================================================================================
   SEÇÃO DE CONTROLES DE PAGINAÇÃO
   ================================================================================== */

/* --------------------------------------------------------------------------------
   ELEMENTOS DOM PARA PAGINAÇÃO AVANÇADA
   -------------------------------------------------------------------------------- */

// Elementos de paginação para ir para página específica
const pageInput = document.getElementById('page-input');
const goButton = document.getElementById('go-button');
const currentPageDisplay = document.getElementById('current-page-display');
const totalPagesDisplay = document.getElementById('total-pages-display');

/* --------------------------------------------------------------------------------
   ATUALIZAR BOTÕES E DISPLAYS DE PAGINAÇÃO
   -------------------------------------------------------------------------------- */

function updatePaginationButtons() {
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    
    // Atualizar displays se existirem
    if (currentPageDisplay) {
        currentPageDisplay.textContent = currentPage;
    }
    if (totalPagesDisplay) {
        totalPagesDisplay.textContent = totalPages;
    }
    if (pageInput) {
        pageInput.max = totalPages;
        pageInput.value = '';
        pageInput.placeholder = currentPage;
    }
}

/* --------------------------------------------------------------------------------
   NAVEGAR PARA PÁGINA ESPECÍFICA
   -------------------------------------------------------------------------------- */

function goToPage(pageNumber) {
    const page = parseInt(pageNumber);
    
    if (isNaN(page)) {
        alert('Por favor, insira um número válido');
        pageInput.value = '';
        return;
    }
    
    if (page < 1 || page > totalPages) {
        alert(`Por favor, insira um número entre 1 e ${totalPages}`);
        pageInput.value = '';
        return;
    }
    
    if (activeTypeFilter !== 'all') {
        alert('A paginação está desativada com filtros ativos');
        pageInput.value = '';
        return;
    }
    
    if (activeSearchTerm !== '') {
        alert('Limpe a pesquisa para usar a paginação');
        pageInput.value = '';
        return;
    }
    
    currentPage = page;
    fetchPokemonList();
    pageInput.value = '';
}

/* --------------------------------------------------------------------------------
   CONFIGURAR EVENT LISTENERS PARA PAGINAÇÃO AVANÇADA
   -------------------------------------------------------------------------------- */

function setupEventListenersForPagination() {
    // Event listeners para o sistema de ir para página específica
    if (goButton) {
        goButton.addEventListener('click', () => {
            const pageNumber = pageInput ? pageInput.value : null;
            if (pageNumber) {
                goToPage(pageNumber);
            }
        });
    }

    // Permitir usar Enter no campo de input
    if (pageInput) {
        pageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const pageNumber = pageInput.value;
                if (pageNumber) {
                    goToPage(pageNumber);
                }
            }
        });

        // Validação em tempo real do input
        pageInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value < 1) {
                e.target.value = 1;
            } else if (value > totalPages) {
                e.target.value = totalPages;
            }
        });
    }
}


/* ==================================================================================
   MODAL DE DETALHES DO POKÉMON
   ================================================================================== */

/* ==================================================================================
   MODAL DE DETALHES DO POKÉMON COM SISTEMA DE ABAS
   ================================================================================== */

/* --------------------------------------------------------------------------------
   MOSTRAR DETALHES DO POKÉMON NO MODAL COM ABAS
   -------------------------------------------------------------------------------- */

async function showPokemonDetails(pokemonId) {
    showSpinner();
    pokemonDetail.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/pokemon/${pokemonId}`);
       

        if (!response.ok) {
            throw new Error('Pokémon não encontrado');
        }
        
       
        const pokemon = await response.json(); 
        window.currentPokemonId = pokemon.id;

        // Buscar dados da evolução
        const evolutionData = await fetchEvolutionChain(pokemon.species.url);
        
        // Buscar informações da espécie
        const speciesInfo = await fetchSpeciesInfo(pokemon.species.url);

        // Obter o tipo primário do Pokémon
        const primaryType = pokemon.types[0].type.name;
        const typeColor = `var(--type-${primaryType})`;
        
        // Aplicar a cor do tipo ao modal
        pokemonDetail.style.setProperty('--type-color', typeColor);
        // Definir variável CSS para rgba (para gradientes)
        const typeColorRgb = getTypeColorRgb(primaryType);
        pokemonDetail.style.setProperty('--type-color-rgb', typeColorRgb);

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
        );

        // Criar o conteúdo HTML para o modal com abas
        pokemonDetail.innerHTML = `
            <img src="${imageUrl}" alt="${pokemon.name}">
            <h2>
                ${pokemon.name}
                <span class="pokemon-detail-id">#${pokemon.id.toString().padStart(3, '0')}</span>
            </h2>
            <div class="detail-types">
                ${types.map(type => `<span class="type ${type.class}">${type.name}</span>`).join('')}
            </div>
            
            <!-- Sistema de Abas -->
            <div class="modal-tabs">
                <button class="tab-button active" data-tab="about">
                    <i class="fas fa-info-circle"></i> Sobre
                </button>
                <button class="tab-button" data-tab="stats">
                    <i class="fas fa-chart-bar"></i> Status
                </button>
                <button class="tab-button" data-tab="evolution">
                    <i class="fas fa-sync-alt"></i> Evoluções
                </button>
            </div>
            
             <!-- Conteúdo da Aba Sobre -->
            <div class="tab-content active" id="about-tab">
                <div class="about-content">
                    <div class="about-info-box">
                        <h4><i class="fas fa-ruler-vertical"></i> Altura</h4>
                        <p>${pokemon.height / 10} m</p>
                    </div>
                    <div class="about-info-box">
                        <h4><i class="fas fa-weight-scale"></i> Peso</h4>
                        <p>${pokemon.weight / 10} kg</p>
                    </div>
                    <div class="about-info-box">
                        <h4><i class="fas fa-star"></i> Experiência Base</h4>
                        <p>${pokemon.base_experience} XP</p>
                    </div>
                    <div class="about-info-box">
                        <h4><i class="fas fa-map-marker-alt"></i> Região de Origem</h4>
                        <p>${speciesInfo.originRegion}</p>
                    </div>
                    <div class="about-info-box abilities-box">
                        <h4><i class="fas fa-magic"></i> Habilidades</h4>
                        <div class="abilities-list">
                            ${abilities.map(ability => `<span class="ability-tag">${ability}</span>`).join('')}
                        </div>
                    </div>
                    
                </div>
            </div>
            
            <!-- Conteúdo da Aba Status -->
            <div class="tab-content" id="stats-tab">
                <div class="stats-content">
                    <div class="stats-grid">
                        ${stats.map(stat => `
                            <div class="stat-item-enhanced">
                                <div class="stat-icon-container">
                                    <i class="fas ${getStatIcon(stat.name)} stat-icon-enhanced"></i>
                                </div>
                                <div class="stat-info">
                                    <div class="stat-name-enhanced">${stat.name}</div>
                                    <div class="stat-bar-enhanced">
                                        <div class="stat-value-enhanced" style="width: ${stat.percentage}%"></div>
                                    </div>
                                </div>
                                <div class="stat-number-enhanced">${stat.value}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Conteúdo da Aba Evoluções -->
            <div class="tab-content" id="evolution-tab">
                <div class="evolution-content">
                    ${evolutionData}
                </div>
            </div>
        `;

        // Configurar event listeners para as abas
        setupTabListeners();

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

 /*--------------------------------------------------------------------------------
   BUSCAR CADEIA DE EVOLUÇÃO (DESIGN MELHORADO + FORMAS VARIANTES)
   -------------------------------------------------------------------------------- */

async function fetchEvolutionChain(speciesUrl) {
    try {
        const speciesResponse = await fetch(speciesUrl);
        const speciesData = await speciesResponse.json();
        
        const evolutionResponse = await fetch(speciesData.evolution_chain.url);
        const evolutionData = await evolutionResponse.json();
        
        const evolutionChain = await parseEvolutionChainWithVariants(evolutionData.chain);
        
        if (evolutionChain.length <= 1 && evolutionChain[0]?.length <= 1) {
            return `
                <div class="no-evolution">
                    <i class="fas fa-ban"></i>
                    <p>Este Pokémon não possui evoluções</p>
                </div>
            `;
        }
        
        return `
            <div class="evolution-grid">
                ${evolutionChain.map((stage, stageIndex) => `
                    <div class="evolution-stage-grid">
                        <h4 class="evolution-stage-title">
                            ${stageIndex === 0 ? 'Forma Base' : `${stageIndex + 1}ª Evolução`}
                        </h4>
                        <div class="evolution-cards">
                            ${stage.map(pokemon => `
                                <div class="evolution-card ${pokemon.id === window.currentPokemonId ? 'current-pokemon' : ''}" 
                                     onclick="showPokemonDetails(${pokemon.id})">
                                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png" 
                                         alt="${pokemon.name}" 
                                         onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png'">
                                    <div class="evolution-info">
                                        <div class="evolution-name">${pokemon.name}</div>
                                        <div class="evolution-id">#${pokemon.id.toString().padStart(3, '0')}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Erro ao buscar evolução:', error);
        return `
            <div class="no-evolution">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar informações de evolução</p>
            </div>
        `;
    }
}

/* --------------------------------------------------------------------------------
   PROCESSAR CADEIA DE EVOLUÇÃO COM FORMAS VARIANTES (CORRIGIDA)
   -------------------------------------------------------------------------------- */

async function parseEvolutionChainWithVariants(chain) {
    const evolutionStages = [];
    
    // Função auxiliar para buscar formas variantes de um Pokémon
    async function getVariantForms(pokemonId, pokemonName) {
        const variants = [];
        
        // Lista de IDs conhecidos de formas especiais (você pode expandir esta lista)
        const variantMap = {
            // Charizard e suas formas
            6: [10034, 10035, 10196], // Mega X, Mega Y, Gigantamax
            // Venusaur
            3: [10033, 10195], // Mega, Gigantamax
            // Blastoise
            9: [10036, 10197], // Mega, Gigantamax
            // Alakazam
            65: [10037], // Mega
            // Gengar
            94: [10038, 10198], // Mega, Gigantamax
            // Kangaskhan
            115: [10039], // Mega
            // Pinsir
            127: [10040], // Mega
            // Gyarados
            130: [10041], // Mega
            // Aerodactyl
            142: [10042], // Mega
            // Mewtwo
            150: [10043, 10044], // Mega X, Mega Y
            // Ampharos
            181: [10045], // Mega
            // Scizor
            212: [10046], // Mega
            // Heracross
            214: [10047], // Mega
            // Houndoom
            229: [10048], // Mega
            // Tyranitar
            248: [10049], // Mega
            // Blaziken
            257: [10050], // Mega
            // Gardevoir
            282: [10051], // Mega
            // Mawile
            303: [10052], // Mega
            // Aggron
            306: [10053], // Mega
            // Medicham
            308: [10054], // Mega
            // Manectric
            310: [10055], // Mega
            // Banette
            354: [10056], // Mega
            // Absol
            359: [10057], // Mega
            // Garchomp
            445: [10058], // Mega
            // Lucario
            448: [10059], // Mega
            // Abomasnow
            460: [10060], // Mega
            // Pikachu formas especiais (algumas)
            25: [10080, 10081, 10082, 10083, 10084, 10199], // Várias formas especiais + Gigantamax
        };
        
        // Adiciona o Pokémon original
        variants.push({ name: pokemonName, id: pokemonId });
        
        // Adiciona as formas variantes se existirem
        if (variantMap[pokemonId]) {
            for (const variantId of variantMap[pokemonId]) {
                try {
                    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${variantId}`);
                    if (response.ok) {
                        const variantData = await response.json();
                        variants.push({
                            name: variantData.name,
                            id: variantId
                        });
                    }
                } catch (error) {
                    console.log(`Forma variante ${variantId} não encontrada para ${pokemonName}`);
                }
            }
        }
        
        return variants;
    }
    
    async function processEvolutionStage(current, stageIndex = 0) {
        // Se não existe esse estágio ainda, cria um array vazio
        if (!evolutionStages[stageIndex]) {
            evolutionStages[stageIndex] = [];
        }
        
        // Extrai ID do Pokémon atual
        const pokemonId = parseInt(current.species.url.split('/').slice(-2, -1)[0]);
        const pokemonName = current.species.name;
        
        // Busca todas as formas variantes do Pokémon atual
        const variants = await getVariantForms(pokemonId, pokemonName);
        
        // Adiciona todas as variantes ao estágio atual
        evolutionStages[stageIndex].push(...variants);
        
        // Processa todas as evoluções possíveis (não apenas a primeira)
        if (current.evolves_to && current.evolves_to.length > 0) {
            for (const evolution of current.evolves_to) {
                await processEvolutionStage(evolution, stageIndex + 1);
            }
        }
    }
    
    await processEvolutionStage(chain);
    
    // Remove duplicatas baseado no ID
    evolutionStages.forEach(stage => {
        const uniqueIds = new Set();
        stage = stage.filter(pokemon => {
            if (uniqueIds.has(pokemon.id)) {
                return false;
            }
            uniqueIds.add(pokemon.id);
            return true;
        });
    });
    
    return evolutionStages;
}

/* --------------------------------------------------------------------------------
   BUSCAR INFORMAÇÕES DA ESPÉCIE (NOVA FUNÇÃO)
   -------------------------------------------------------------------------------- */

async function fetchSpeciesInfo(speciesUrl) {
    try {
        const response = await fetch(speciesUrl);
        const speciesData = await response.json();
        
        // Buscar a região de origem
        let originRegion = 'Desconhecida';
        if (speciesData.generation && speciesData.generation.name) {
            const generationName = speciesData.generation.name;
            const regionMap = {
                'generation-i': 'Kanto',
                'generation-ii': 'Johto', 
                'generation-iii': 'Hoenn',
                'generation-iv': 'Sinnoh',
                'generation-v': 'Unova',
                'generation-vi': 'Kalos',
                'generation-vii': 'Alola',
                'generation-viii': 'Galar',
                'generation-ix': 'Paldea'
            };
            originRegion = regionMap[generationName] || 'Desconhecida';
        }
        
        return {
            originRegion,

        };
    } catch (error) {
        console.error('Erro ao buscar informações da espécie:', error);
        return {
            originRegion: 'Desconhecida',
        };
    }
}

/* --------------------------------------------------------------------------------
   CONFIGURAR EVENT LISTENERS DAS ABAS
   -------------------------------------------------------------------------------- */

function setupTabListeners() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Remover classe active de todos os botões e conteúdos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado e conteúdo correspondente
            button.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

/* --------------------------------------------------------------------------------
   FUNÇÕES AUXILIARES
   -------------------------------------------------------------------------------- */

function getStatIcon(statName) {
    const statIcons = {
        hp: 'fa-heart',
        attack:'fa-bolt',
        defense:'fa-shield',
        'special attack': 'fa-fire',
        'special defense': 'fa-shield-halved',
        speed: 'fa-gauge-high'
    };
    return statIcons[statName] || 'fa-circle-info';
}

function getTypeColorRgb(type) {
    const typeColors = {
        normal: '150, 150, 138',
        fire: '238, 129, 48',
        water: '99, 144, 240',
        grass: '122, 199, 76',
        electric: '247, 208, 44',
        ice: '150, 217, 214',
        fighting: '194, 46, 40',
        poison: '163, 62, 161',
        ground: '226, 191, 101',
        flying: '169, 143, 243',
        psychic: '249, 85, 135',
        bug: '166, 185, 26',
        rock: '182, 161, 54',
        ghost: '115, 87, 151',
        dragon: '111, 53, 252',
        dark: '112, 87, 70',
        steel: '183, 183, 206',
        fairy: '214, 133, 173'
    };
    return typeColors[type] || '168, 167, 122';
}
/* ==================================================================================
   SEÇÃO DE BUSCA E PESQUISA
   ================================================================================== */

/* --------------------------------------------------------------------------------
   BUSCAR POKÉMON PELO NOME OU ID
   -------------------------------------------------------------------------------- */

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
        // 1. SEMPRE busca na API primeiro (ignora resultados locais)
        // Tenta buscar como ID (se for número)
        if (!isNaN(searchTerm)) {
            try {
                const response = await fetch(`${API_BASE_URL}/pokemon/${searchTerm}`);
                if (response.ok) {
                    const pokemon = await response.json();
                    filteredPokemon = [pokemon];
                    renderPokemonCards(filteredPokemon);
                    hideSpinner();
                    
                    // Desativa paginação durante a busca
                    prevButton.disabled = true;
                    nextButton.disabled = true;
                    return;
                }
            } catch (idError) {
                console.log('Não encontrou por ID, tentando por nome');
            }
        }

        // 2. Busca por nome na API
        const allPokemonResponse = await fetch(`${API_BASE_URL}/pokemon?limit=1000`);
        const allPokemonData = await allPokemonResponse.json();
        
        // Filtra e limita a 50 resultados
        const matches = allPokemonData.results
            .filter(pokemon => pokemon.name.includes(searchTerm))
            .slice(0, 50);

        if (matches.length > 0) {
            // Busca os detalhes dos Pokémon encontrados
            const detailedPokemon = await Promise.all(
                matches.map(pokemon => 
                    fetch(pokemon.url).then(res => res.json())
                )
            );
            
            filteredPokemon = detailedPokemon;
            renderPokemonCards(filteredPokemon);
        } else {
            throw new Error('Nenhum Pokémon encontrado');
        }
        
        hideSpinner();
    } catch (error) {
        console.error('Erro na busca:', error);
        pokemonGrid.innerHTML = '';
        showError();
        hideSpinner();
    } finally {
        // Desativa paginação durante a busca
        prevButton.disabled = true;
        nextButton.disabled = true;
    }
}

/* ==================================================================================
   SEÇÃO DE FILTROS E COMBINAÇÃO DE PESQUISA
   ================================================================================== */
/* --------------------------------------------------------------------------------
   APLICAR FILTROS (TIPO E BUSCA)
   -------------------------------------------------------------------------------- */

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

/* ==================================================================================
   CONFIGURAÇÃO DE EVENT LISTENERS
   ================================================================================== */

/* --------------------------------------------------------------------------------
   CONFIGURAR EVENT LISTENERS - INTERAÇÕES DO USUÁRIO
   -------------------------------------------------------------------------------- */

function setupEventListeners() {
        // Configurar listeners da paginação avançada
    if (goButton) {
        goButton.addEventListener('click', () => {
            if (!pageInput || !pageInput.value) {
                alert('Por favor, digite um número de página');
                return;
            }
            goToPage(pageInput.value);
        });
    }

    if (pageInput) {
        pageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && pageInput.value) {
                goToPage(pageInput.value);
            }
        });
    }

    // Event listeners para paginação
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

    // Event listeners para pesquisa
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Event listeners para modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Event listeners para filtros por tipo
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

    // Event listener para resetar filtros
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
/* ==================================================================================
   UTILITÁRIOS PARA SPINNER E MENSAGENS DE ERRO
   ================================================================================== */

/* --------------------------------------------------------------------------------
   CONTROLE DO SPINNER DE CARREGAMENTO
   -------------------------------------------------------------------------------- */

function showSpinner() {
    spinner.style.display = 'block';
}

function hideSpinner() {
    spinner.style.display = 'none';
}

/* --------------------------------------------------------------------------------
   CONTROLE DE MENSAGENS DE ERRO
   -------------------------------------------------------------------------------- */

function showError() {
    errorMessage.style.display = 'block';
}