import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { base44 } from '@/api/base44Client';
import { pagesConfig } from '@/pages.config';

const restoreScrollOnNavigation = () => {
    window.scrollTo(0, 0);
};

const postEmbeddedUrlChange = () => {
    window.parent?.postMessage({
        type: "app_changed_url",
        url: window.location.href
    }, '*');
};

const resolveCurrentPageName = (pathname, Pages, mainPageKey) => {
    if (pathname === '/' || pathname === '') {
        return mainPageKey;
    }

    const pathSegment = pathname.replace(/^\//, '').split('/')[0];
    const pageKeys = Object.keys(Pages);
    const matchedKey = pageKeys.find(
        key => key.toLowerCase() === pathSegment.toLowerCase()
    );

    return matchedKey || null;
};

const logAuthenticatedPageActivity = (pageName) => {
    // Legacy Base44 app logging compatibility: keep the current app log
    // call intact until telemetry moves to an app-owned analytics layer.
    return base44.appLogs.logUserInApp(pageName);
};

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    // Route-change detection: preserve current scroll restoration and
    // iframe/embed messaging behavior on every navigation update.
    useEffect(() => {
        restoreScrollOnNavigation();
        postEmbeddedUrlChange();
    }, [location]);

    // Future migration seam: page activity logging should move behind an
    // app-owned telemetry/logger boundary without changing callers first.
    useEffect(() => {
        const pageName = resolveCurrentPageName(location.pathname, Pages, mainPageKey);

        if (isAuthenticated && pageName) {
            logAuthenticatedPageActivity(pageName).catch(() => {
                // Silently fail - logging shouldn't break the app
            });
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    return null;
}
