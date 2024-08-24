alter table github_projects_history
    alter column contributors set default (-1);

alter table github_projects_history
    add stars int default -1 not null;