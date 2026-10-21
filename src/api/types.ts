// Alias des types générés depuis le schéma OpenAPI (npm run api:types) : ne jamais les réécrire à la main.
import type { components, operations } from './schema'

type Schemas = components['schemas']

export type User = Schemas['User']
export type Role = Schemas['RoleEnum']
export type LoginInput = Schemas['Login']
export type RegisterInput = Schemas['Register']
export type Profile = Schemas['Profile']
export type ProfileUpdate = Schemas['PatchedProfileUpdate']
export type ContentLanguage = Schemas['ContentLanguageEnum']

export type AppConfig = Schemas['AppConfig']
export type NetworkOption = Schemas['NetworkOption']
export type Network = Schemas['NetworkEnum']
export type Duration = Schemas['DurationEnum']

export type Project = Schemas['Project']
export type ProjectListItem = Schemas['ProjectListItem']
export type ProjectStatus = Schemas['ProjectStatusEnum']
export type ProjectCreate = Schemas['ProjectCreate']
export type ProjectBriefUpdate = Schemas['PatchedProjectBriefUpdate']
export type PaginatedProjectList = Schemas['PaginatedProjectList']
export type Idea = Schemas['Idea']
export type IdeaSource = Schemas['IdeaSource']
export type CriteriaScores = Schemas['CriteriaScores']
export type IdeasContext = Schemas['IdeasContext']
export type SafetyAlert = Schemas['SafetyAlert']
export type Segment = Schemas['Segment']
export type Scene = Schemas['Scene']
export type Dashboard = Schemas['Dashboard']
export type AgentName = Schemas['AgentEnum']
export type AgentRunSummary = Schemas['AgentRunSummary']
export type RunStatus = Schemas['RunStatusEnum']

export type AgentStatus = Schemas['AgentStatus']
export type AgentLastRun = Schemas['AgentLastRun']
export type AgentMetrics = Schemas['AgentMetrics']
export type AgentTestResult = Schemas['AgentTestResult']
export type AgentRun = Schemas['AgentRun']
export type PaginatedAgentRunList = Schemas['PaginatedAgentRunList']

export type ProjectFilters = NonNullable<operations['projects_list']['parameters']['query']>
export type RunFilters = NonNullable<operations['admin_runs_retrieve']['parameters']['query']>
export type MetricsPeriod = NonNullable<operations['admin_metrics_list']['parameters']['query']>
export type ExportFormat = NonNullable<operations['projects_export_retrieve']['parameters']['query']>['format']
