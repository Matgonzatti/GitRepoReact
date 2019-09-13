import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FaCog } from 'react-icons/fa';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container/index';
import {
  Loading,
  Owner,
  IssuesList,
  FilterIssues,
  NavigationPages,
} from './styles';

export default class Repository extends Component {
  // eslint-disable-next-line react/static-property-placement
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  // eslint-disable-next-line react/state-in-constructor
  state = {
    repository: {},
    issues: [],
    loading: true,
    filters: [
      { state: 'all', text: 'Todas', selected: true },
      { state: 'open', text: 'Abertas', selected: false },
      { state: 'closed', text: 'Fechadas', selected: false },
    ],
    indexFilter: 0,
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filters } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    // Executar duas chamadas para a API ao mesmo tempo.
    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filters.find(f => f.selected).state,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  loadIssues = async () => {
    const { match } = this.props;
    const { filters, indexFilter, page } = this.state;

    const repoName = await decodeURIComponent(match.params.repository);

    const response = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filters[indexFilter].state,
        per_page: 5,
        page,
      },
    });

    this.setState({ issues: response.data });
  };

  handleFilter = async indexFilter => {
    await this.setState({ indexFilter });
    this.loadIssues();
  };

  handlePage = async action => {
    const { page } = this.state;
    await this.setState({
      page: action === 'previous' ? page - 1 : page + 1,
    });
    this.loadIssues();
  };

  render() {
    const {
      repository,
      issues,
      loading,
      filters,
      indexFilter,
      page,
    } = this.state;

    if (loading) {
      return (
        <Loading>
          <FaCog color="#fff" size={60} />
        </Loading>
      );
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssuesList>
          <FilterIssues selected={indexFilter}>
            {filters.map((filter, index) => (
              <button
                type="button"
                key={filter.text}
                onClick={() => this.handleFilter(index)}
              >
                {filter.text}
              </button>
            ))}
          </FilterIssues>

          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssuesList>
        <NavigationPages>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => this.handlePage('previous')}
          >
            Anterior
          </button>
          <span>Página: {page}</span>
          <button type="button" onClick={() => this.handlePage('next')}>
            Próximo
          </button>
        </NavigationPages>
      </Container>
    );
  }
}
