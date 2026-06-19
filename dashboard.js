/* =========================================================
   CORREÇÃO DESKTOP - CARDS E FILTROS
   ========================================================= */

/* Garante que o dashboard fique acima de qualquer sobra visual do header */
#dashboard {
    position: relative;
    z-index: 2;
}

/* Evita que o logo ou qualquer sobra do header capture clique fora dele */
#header {
    overflow: hidden;
}

#logo {
    height: 95px !important;
    max-height: 95px !important;
    pointer-events: none !important;
}

/* Filtros sempre clicáveis */
.filtros-dashboard {
    position: relative !important;
    z-index: 100001 !important;

    display: flex !important;
    flex-wrap: wrap !important;

    gap: 12px !important;

    margin-bottom: 28px !important;

    pointer-events: auto !important;
}

.filtros-dashboard button {
    position: relative !important;
    z-index: 100002 !important;

    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;

    min-width: 115px !important;
    height: 52px !important;

    padding: 0 18px !important;

    border: none !important;
    border-radius: 10px !important;

    background: white !important;
    color: #0b2f5b !important;

    font-size: 16px !important;
    font-weight: 700 !important;

    cursor: pointer !important;

    box-shadow: 0 2px 8px rgba(0,0,0,.08) !important;

    pointer-events: auto !important;

    line-height: 1 !important;

    transition: transform .2s ease, background .2s ease, color .2s ease, box-shadow .2s ease !important;
}

.filtros-dashboard button:hover {
    background: #0b2f5b !important;
    color: white !important;

    transform: translateY(-2px) !important;

    box-shadow: 0 6px 18px rgba(0,0,0,.16) !important;
}


/* =========================================================
   DESKTOP / NOTEBOOK
   Mantém 5 cards na mesma linha mesmo em janela menor
   ========================================================= */

@media (hover: hover) and (pointer: fine) {

    .cards-5 {
        grid-template-columns: repeat(5, minmax(120px, 1fr)) !important;
        gap: 12px !important;
    }

    .card {
        padding: 14px !important;
    }

    .card h3 {
        font-size: clamp(11px, 0.9vw, 14px) !important;
        line-height: 1.2 !important;
    }

    .card strong {
        font-size: clamp(17px, 1.6vw, 24px) !important;
        line-height: 1.2 !important;
    }

    .card span {
        font-size: clamp(12px, 1vw, 15px) !important;
    }

    .card p {
        font-size: clamp(10px, 0.85vw, 13px) !important;
    }
}


/* Janela de computador minimizada */
@media (hover: hover) and (pointer: fine) and (max-width: 1100px) {

    #dashboard {
        padding: 14px !important;
    }

    .cards-5 {
        grid-template-columns: repeat(5, minmax(95px, 1fr)) !important;
        gap: 10px !important;
    }

    .card {
        padding: 12px !important;
        border-left-width: 4px !important;
    }

    .card h3 {
        font-size: 11px !important;
    }

    .card strong {
        font-size: 18px !important;
    }

    .card p {
        font-size: 10px !important;
    }

    .filtros-dashboard button {
        min-width: 95px !important;
        height: 46px !important;
        font-size: 14px !important;
        padding: 0 12px !important;
    }
}


/* =========================================================
   MOBILE
   Só aplica layout mobile em tela de toque
   ========================================================= */

@media (hover: none) and (pointer: coarse) and (max-width: 800px) {

    #header {
        position: relative !important;
        top: auto !important;
        left: auto !important;

        height: auto !important;
        min-height: auto !important;

        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;

        padding: 18px 16px 16px 16px !important;

        box-sizing: border-box !important;
    }

    #logo {
        height: 90px !important;
        width: auto !important;

        margin: 0 0 12px 0 !important;

        pointer-events: none !important;
    }

    #titulo {
        margin: 0 !important;

        text-align: center !important;

        font-size: 18px !important;
        line-height: 1.25 !important;

        max-width: 100% !important;
    }

    #menu {
        width: 100% !important;

        margin: 18px 0 0 0 !important;

        display: flex !important;
        justify-content: center !important;
        gap: 14px !important;
    }

    .menu-btn {
        padding: 12px 18px !important;

        font-size: 18px !important;

        border-radius: 8px !important;
    }

    #dashboard {
        margin-top: 0 !important;

        padding: 16px !important;

        min-height: auto !important;
    }

    .filtros-dashboard {
        display: flex !important;

        flex-wrap: nowrap !important;

        gap: 10px !important;

        overflow-x: auto !important;

        padding: 0 0 12px 0 !important;

        margin-bottom: 22px !important;

        -webkit-overflow-scrolling: touch !important;
    }

    .filtros-dashboard button {
        flex: 0 0 auto !important;

        min-width: 100px !important;
        height: 46px !important;

        padding: 0 14px !important;

        font-size: 15px !important;

        border-radius: 9px !important;
    }

    .cards-5 {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;

        gap: 14px !important;
    }

    .card {
        padding: 16px !important;

        border-left-width: 5px !important;
    }

    .card h3 {
        font-size: 15px !important;
        line-height: 1.2 !important;
    }

    .card strong {
        font-size: 24px !important;
    }

    .card span {
        font-size: 15px !important;
    }

    .card p {
        font-size: 13px !important;
    }

    .graficos-3,
    .graficos-grandes {
        grid-template-columns: 1fr !important;
    }
}


/* Celulares muito estreitos */
@media (hover: none) and (pointer: coarse) and (max-width: 360px) {

    .cards-5 {
        grid-template-columns: 1fr !important;
    }

    .menu-btn {
        font-size: 16px !important;
        padding: 10px 14px !important;
    }

    .card strong {
        font-size: 22px !important;
    }
}
