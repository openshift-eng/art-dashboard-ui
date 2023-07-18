import withAuth from '../../components/login/withAuth';

function PrivatePage() {
    return <h1>Private Page</h1>;
}

export default withAuth(PrivatePage);
