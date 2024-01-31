
import { request, gql } from 'graphql-request'

export async function getMetricActivity(req, res, next) {
    const query = gql`
query MetricActivity($label: String!,$level: String!) {
    metricActivity(label: $label, level: $level) {
        activeC1IssueCommentsContributorCount
        activeC1IssueCreateContributorCount
        activeC1PrCommentsContributorCount
        activeC1PrCreateContributorCount
        activeC2ContributorCount
        activityScore
        closedIssuesCount
        codeReviewCount
        commentFrequency
        commitFrequency
        contributorCount
        createdSince
        grimoireCreationDate
        label
        level
        orgCount
        recentReleasesCount
        shortCode
        type
        updatedIssuesCount
        updatedSince
    }
}
`;
    const variables = {
        label: "https://github.com/sveltejs/svelte",
        level: "repo"
    };
    const data = await request('https://oss-compass.org/api/graphql', query, variables);
    res.status(200).json(data);
}