import React, { useState, useEffect, useCallback } from 'react';
import RepositoryList from './components/RepositoryList';
import Error from './components/Error';
import {
    getUserReposLimited,
    getUserInfo,
    getUserReposAll,
} from './services/githubService';
import Navbar from './components/Navbar';
import SearchBarBig from './components/SearchBarBig';
import UserOverview from './components/UserOverview';
import Pagination from './components/Pagination';
import Search from './components/Search';
import Dropdown from './components/Dropdown';

const App: React.FC = () => {
    const [reposLoading, setReposLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState<string>('');
    const [userInfo, setUserInfo] = useState<any | null>(null);
    const [userNotFound, setUserNotFound] = useState<boolean>(false);
    const [hasNextPage, setHasNextPage] = useState<boolean>(false);
    const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(false);
    const [repoNameFilter, setRepoNameFilter] = useState<string>('');
    const [repoLanguageFilter, setRepoLanguageFilter] = useState<string>('');
    const [filteredRepositories, setFilteredRepositories] = useState<any[]>([]);
    const [allRepositories, setAllRepositories] = useState<any[]>([]);
    const [page, setPage] = useState<number>(0);
    const [languages, setLanguages] = useState<any[]>([]);
    const [displayedRepositories, setDisplayedRepositories] = useState<any[]>([]);
    const [darkMode, setDarkMode] = useState<boolean>(
        localStorage.theme === 'dark' ||
        (!('theme' in localStorage) &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
    );

    /**
     * Fetch all repositories for the user
     */
    const fetchAllRepositories = useCallback(async () => {
        try {
            const allRepoData = await getUserReposAll(username);
            setAllRepositories(allRepoData.repositories);
            setReposLoading(false);
            setError(null);
        } catch (error) {
            console.error('Error fetching all repositories', error);
            setReposLoading(false);
            setError('Error fetching all repositories.');
        }
    }, [username]);

    /**
     * Fetch the initial repositories for the user
     */
    const fetchInitialRepositories = useCallback(async () => {
        try {
            setReposLoading(true);

            // Wait 200ms to prevent the loading indicator from flashing
            await new Promise((resolve) => setTimeout(resolve, 200));

            // Fetch the first 10 repositories
            const initialRepoData = await getUserReposLimited(username, 10);
            setDisplayedRepositories(initialRepoData.repositories);
            setHasNextPage(initialRepoData.hasNextPage);

            setReposLoading(false);

            await fetchAllRepositories();

            setError(null);
        } catch (error) {
            console.error('Error fetching data', error);
            setReposLoading(false);
            setError('Error fetching data.');
        }
    }, [username, fetchAllRepositories]);

    /**
     * Fetch the user info
     */
    const fetchUser = useCallback(async () => {
        try {
            const userData = await getUserInfo(username);
            if (userData === null) {
                setUserNotFound(true);
                setUserInfo(null);
                setAllRepositories([]);
                return;
            } else {
                setUserNotFound(false);
                setUserInfo(userData);
            }
            setError(null);
        } catch (error) {
            console.error('Error fetching data', error);
            setError('Error fetching data.');
        }
    }, [username]);

    /**
     * Fetch the next page of repositories
     */
    useEffect(() => {
        setUserInfo(null);
        if (username.trim() !== '') {
            fetchUser();
            fetchInitialRepositories();
        }
        setRepoNameFilter('');
        setRepoLanguageFilter('');
    }, [username, fetchUser, fetchInitialRepositories]);

    /**
     * Fetch all repositories when the user changes
     */
    useEffect(() => {
        setFilteredRepositories(allRepositories);
        const languagesSet = new Set();
        allRepositories.forEach((repo) => {
            if (repo.primaryLanguage) {
                languagesSet.add(repo.primaryLanguage.name);
            }
        });
        setLanguages(
            Array.from(languagesSet).map((language) => ({
                linkName: language,
            }))
        );
    }, [allRepositories]);

    /**
     * set the dark mode class on the html element
     */
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.theme = darkMode ? 'dark' : 'light';
    }, [darkMode]);

    /**
     * Filter the repositories based on the name and language filters
     */
    useEffect(() => {
        const filtered = allRepositories
            .filter((repo) =>
                repo.name.toLowerCase().includes(repoNameFilter.toLowerCase())
            )
            .filter(
                (repo) =>
                    repo.primaryLanguage?.name
                        ?.toLowerCase()
                        .includes(repoLanguageFilter.toLowerCase())
            );
        setFilteredRepositories(filtered);
    }, [repoNameFilter, repoLanguageFilter, allRepositories]);

    /**
     * Handle page change
     */
    const handlePageChange = (pageChange: number) => {
        const newPage = page + pageChange;

        setHasPreviousPage(newPage > 0);
        setHasNextPage(filteredRepositories.length > (newPage + 1) * 10);

        const startIndex = newPage * 10;
        const endIndex = startIndex + 10;
        const filteredRepos = filteredRepositories
            .slice(startIndex, endIndex)
            .filter((repo) =>
                repo.name.toLowerCase().includes(repoNameFilter.toLowerCase())
            )
            .filter(
                (repo) =>
                    repo.primaryLanguage?.name
                        ?.toLowerCase()
                        .includes(repoLanguageFilter.toLowerCase())
            );

        setDisplayedRepositories(filteredRepos);
        setPage(newPage);
    };

    /**
     * Handle user search
     */
    const handleUserSearch = (text: string) => {
        if (text.trim() === '') {
            return;
        }
        setUsername(text);
        setPage(0);
        setHasNextPage(false);
        setHasNextPage(false);
        setFilteredRepositories([]);
        setAllRepositories([]);
        setDisplayedRepositories([]);
    };

    /**
     * Handle repo name filter
     */
    useEffect(() => {
        setDisplayedRepositories(filteredRepositories.slice(0, 10));
        setPage(0);
        setHasPreviousPage(false);
        if (filteredRepositories.length > 10) {
            setHasNextPage(true);
        } else {
            setHasNextPage(false);
        }
    }, [filteredRepositories]);

    /**
     * Handle repo language filter
     */
    const handleRepoNameFilter = (text: string) => {
        setRepoNameFilter(text);
    };

    /**
     * Handle repo language filter
     */
    const handleRepoLangFilter = (text: string) => {
        setRepoLanguageFilter(text);
    };

    return (
        <>
            <Navbar
                darkMode={darkMode}
                onDarkModeToggle={() => setDarkMode(!darkMode)}
            />

            <div
                className={`bg-white dark:bg-zinc-900 ${
                    darkMode ? 'dark' : ''
                }`}
                style={{
                    backgroundColor: darkMode ? '#000' : '#F4F2ED',
                    minHeight: '100vh',
                }}
            >
                <div className={`container mx-auto p-4`}>
                    <h1 className="text-4xl font-bold mb-4 dark:text-zinc-50">
                        Home
                    </h1>
                    <SearchBarBig onSearch={handleUserSearch} />
                    <div className="container flex flex-col md:flex-row md:gap-4 ">
                        {userInfo && (
                            <div className="mb-4 md:mb-0 w-full md:w-1/4">
                                <UserOverview
                                    avatarUrl={userInfo.avatarUrl}
                                    username={userInfo.login}
                                    bio={userInfo.bio}
                                    profileUrl={userInfo.htmlUrl}
                                    location={userInfo.location}
                                />
                            </div>
                        )}
                        {userNotFound && (
                            <div className="w-full md:w-1/4">
                                <Error message="User not found." />
                            </div>
                        )}
                        <div className="md:w-3/4">
                            {userInfo && (
                                <div className="flex flex-col w-full sm:flex-row sm:gap-4">
                                    <div className="mb-4 w-full sm:w-3/5">
                                        <Search
                                            onSearch={handleRepoNameFilter}
                                            placeholder="Search for Repository"
                                        />
                                    </div>
                                    <div className="w-full sm:w-2/5">
                                        <Dropdown
                                            navigationItems={languages}
                                            onChange={handleRepoLangFilter}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="w-full">
                                {userInfo && (
                                    <>
                                        <RepositoryList
                                            repositories={displayedRepositories}
                                            isLoading={reposLoading}
                                        />
                                        {error && <Error message={error} />}
                                        {filteredRepositories.length > 0 && (
                                            <Pagination
                                                isFirstPage={!hasPreviousPage}
                                                isLastPage={!hasNextPage}
                                                onPageChange={handlePageChange}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default App;
