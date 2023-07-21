import { makeApiCall } from '../../components/api_calls/api_calls';
export async function getServerSideProps(context) {
    const { req, res } = context;

    // Call the API endpoint using 'makeApiCall'
    const result = await makeApiCall('/api/v1/check_auth', 'GET', {}, {}, {}, req);

    // If the user is not authenticated or the request failed, redirect to the login page
    if (result.detail === 'Not authenticated' || result.detail === 'Request failed') {
        return {
            redirect: {
                destination: `/?loginRequired=true&next=${req.url}`,
                permanent: false
            }
        };
    }

    // If the user is authenticated, render the page
    return {
        props: {}, // Will be passed to the page component as props
    };
}

function PrivatePageComponent() {
    return (
        <div>
            <h1>Private Page</h1>
            <p>Only accessible to logged in ART members</p>
        </div>
    );
}

export default PrivatePageComponent;
