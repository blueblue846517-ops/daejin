(function(root) {
    // Titles are the only existing classification field. Avoid inferring a method from location alone.
    const definitions = [
        {slug:'urethane', name:'옥상 우레탄 방수', pattern:/우레탄|우레탐|우레탄방수/i},
        {slug:'epoxy', name:'지하주차장 에폭시', pattern:/에폭시|epoxy/i},
        {slug:'injection', name:'인젝션 방수', pattern:/인젝션|주입\s*(방수|공사|보수)|누수\s*주입/i},
        {slug:'painting', name:'내외부 도장', pattern:/도장|페인트|페인팅/i},
        {slug:'repair', name:'건물 각종 보수공사', pattern:/보수|철거|단면\s*복구|미장/i}
    ];
    root.serviceCatalog = { definitions, match: title => definitions.filter(x => x.pattern.test(String(title || ''))) };
    if (typeof module !== 'undefined') module.exports = root.serviceCatalog;
})(typeof window === 'undefined' ? globalThis : window);
