


export function createPageUrl(pageName: string, queryParams?: string) {
    const base = '/' + pageName;
    if (queryParams) {
        return `${base}?${queryParams}`;
    }
    return base;
}
