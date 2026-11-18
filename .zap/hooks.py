"""Escopo da calculadora e exceção restrita para a CSP por meta no Pages."""

import zap_common


SITE = "https://roberioarnaud.github.io/calculadora-imc/"
ESCOPO = r"https://roberioarnaud\.github\.io/calculadora-imc/.*"
CSP_REVISADA = (
    "default-src 'self'; script-src 'self'; style-src 'self'; "
    "object-src 'none'; base-uri 'none'; form-action 'none'"
)


def zap_tuned(zap):
    contexto = "calculadora-imc"
    contexto_id = zap.context.new_context(contexto)
    zap.context.include_in_context(contexto, ESCOPO)
    zap.context.set_context_in_scope(contexto_id, True)
    zap_common.context_name = contexto
    zap.pscan.set_scan_only_in_scope(True)

    # A CSP exata revisada só carece de frame-ancestors, inválido em meta.
    # Reclassifica para informativo (0), preservando o achado no relatório.
    # Outras políticas/evidências de CSP continuam sujeitas à regra 10055.
    zap.alertFilter.add_alert_filter(
        contexto_id, "10055", "0", url=ESCOPO, urlisregex=True,
        evidence=CSP_REVISADA, evidenceisregex=False, enabled=True
    )


def zap_spider(zap, target):
    # O baseline normalmente troca o caminho pela raiz do domínio.
    # Mantém o rastreamento no projeto, sem analisar as páginas 404 do GitHub.
    return zap, SITE
