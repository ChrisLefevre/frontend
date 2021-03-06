import React from 'react';
import PropTypes from 'prop-types';
import Error from '../components/Error';
import withIntl from '../lib/withIntl';
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import CollectiveCard from './CollectiveCard';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

const COLLECTIVE_CARDS_PER_PAGE = 10;

class CollectivesWithData extends React.Component {

  static propTypes = {
    ParentCollectiveId: PropTypes.number,
    limit: PropTypes.number
  }

  constructor(props) {
    super(props);
    this.fetchMore = this.fetchMore.bind(this);
    this.refetch = this.refetch.bind(this);
    this.state = {
      role: null,
      loading: false
    };
  }

  fetchMore(e) {
    e.target.blur();
    this.setState({ loading: true });
    this.props.fetchMore().then(() => {
      this.setState({ loading: false });
    });
  }

  refetch(role) {
    this.setState({role});
    this.props.refetch({role});
  }

  render() {
    const { data } = this.props;

    if (data.error) {
      console.error("graphql error>>>", data.error.message);
      return (<Error message="GraphQL error" />)
    }
    console.log(">>> CollectivesWithData", data);
    if (!data.allCollectives) {
      return (<div />);
    }
    const collectives = [...data.allCollectives];
    if (collectives.length === 0) {
      return (<div />)
    }

    collectives.sort((a, b) => b.totalDonations - a.totalDonations);
    const limit = this.props.limit || COLLECTIVE_CARDS_PER_PAGE * 2;
    return (
      <div className="CollectivesContainer">
        <style jsx>{`
          :global(.loadMoreBtn) {
            margin: 1rem;
            text-align: center;
          }
          .filter {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
          }
          :global(.filterBtnGroup) {
            width: 100%;
          }
          :global(.filterBtn) {
            width: 33%;
          }
          .Collectives {
            display: flex;
            flex-wrap: wrap;
            flex-direction: row;
            justify-content: center;   
            overflow: hidden;
            margin: 1rem 0;
          }
        `}</style>

        <div className="Collectives cardsList">
          { collectives.map((collective) =>
            <CollectiveCard
              key={collective.id}
              collective={collective}
            />
          )}
        </div>
        { collectives.length % 10 === 0 && collectives.length >= limit &&
          <div className="loadMoreBtn">
            <Button bsStyle='default' onClick={this.fetchMore}>
              {this.state.loading && <FormattedMessage id='loading' defaultMessage='loading' />}
              {!this.state.loading && <FormattedMessage id='loadMore' defaultMessage='load more' />}
            </Button>
          </div>
        }
      </div>
    );
  }

}

const getCollectivesQuery = gql`
query allCollectives($ParentCollectiveId: Int, $limit: Int, $offset: Int, $orderBy: String, $orderDirection: String) {
  allCollectives(ParentCollectiveId: $ParentCollectiveId, limit: $limit, offset: $offset, orderBy: $orderBy, orderDirection: $orderDirection) {
    id
    type
    createdAt
    slug
    name
    description
    image
    currency
    backgroundImage
    stats {
      id
      yearlyBudget
      backers
    }
  }
}
`;

export const addCollectivesData = graphql(getCollectivesQuery, {
  options(props) {
    return {
      variables: {
        ParentCollectiveId: props.ParentCollectiveId,
        orderBy: props.orderBy,
        orderDirection: props.orderDirection,
        offset: 0,
        limit: props.limit || COLLECTIVE_CARDS_PER_PAGE * 2
      }
    }
  },
  props: ({ data, ownProps }) => ({
    data,
    fetchMore: () => {
      return data.fetchMore({
        variables: {
          offset: data.allCollectives.length,
          limit: ownProps.limit || COLLECTIVE_CARDS_PER_PAGE
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult
          }
          return Object.assign({}, previousResult, {
            // Append the new posts results to the old one
            allCollectives: [...previousResult.allCollectives, ...fetchMoreResult.allCollectives]
          })
        }
      })
    }
  })  
});


export default addCollectivesData(withIntl(CollectivesWithData));