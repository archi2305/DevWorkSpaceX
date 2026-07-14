"""
Workspace Insights Service

AI-generated insights for workspace health and performance.
All calculations are dynamic based on current workspace data.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from abc import ABC, abstractmethod
import uuid


class InsightsProvider(ABC):
    """Abstract base class for insights providers (future AI compatibility)"""
    
    @abstractmethod
    async def analyze_project_risks(self, projects: List[Dict]) -> List[Dict]:
        pass
    
    @abstractmethod
    async def identify_blocked_tasks(self, tasks: List[Dict]) -> List[Dict]:
        pass
    
    @abstractmethod
    async def identify_slow_progress(self, projects: List[Dict], tasks: List[Dict]) -> List[Dict]:
        pass
    
    @abstractmethod
    async def analyze_member_workload(self, tasks: List[Dict], users: List[Dict]) -> Dict:
        pass
    
    @abstractmethod
    async def predict_sprint_completion(self, sprint: Dict, tasks: List[Dict]) -> Dict:
        pass
    
    @abstractmethod
    async def forecast_completion(self, projects: List[Dict], tasks: List[Dict]) -> Dict:
        pass


class DynamicInsightsProvider(InsightsProvider):
    """Dynamic calculation-based insights provider"""
    
    async def analyze_project_risks(self, projects: List[Dict]) -> List[Dict]:
        """Analyze project risks dynamically based on project metrics"""
        risks = []
        
        for project in projects:
            project_risks = []
            
            # Risk 1: Low completion rate
            if project.get('progress', 0) < 30:
                project_risks.append({
                    'type': 'progress',
                    'severity': 'high',
                    'description': f"Project '{project.get('name')}' has low completion rate ({project.get('progress', 0)}%)",
                    'recommendation': 'Review task priorities and resource allocation'
                })
            
            # Risk 2: Overdue tasks
            overdue_count = project.get('overdue_tasks', 0)
            if overdue_count > 0:
                project_risks.append({
                    'type': 'schedule',
                    'severity': 'high' if overdue_count > 5 else 'medium',
                    'description': f"Project '{project.get('name')}' has {overdue_count} overdue tasks",
                    'recommendation': 'Address overdue tasks immediately'
                })
            
            # Risk 3: High task count without progress
            total_tasks = project.get('total_tasks', 0)
            if total_tasks > 20 and project.get('progress', 0) < 50:
                project_risks.append({
                    'type': 'capacity',
                    'severity': 'medium',
                    'description': f"Project '{project.get('name')}' has many tasks but limited progress",
                    'recommendation': 'Consider breaking down into smaller milestones'
                })
            
            risks.extend(project_risks)
        
        return risks
    
    async def identify_blocked_tasks(self, tasks: List[Dict]) -> List[Dict]:
        """Identify blocked tasks based on dependencies and status"""
        blocked_tasks = []
        
        for task in tasks:
            is_blocked = False
            block_reason = None
            
            # Check for dependency blocks
            if task.get('dependencies'):
                for dep in task.get('dependencies', []):
                    if not dep.get('completed', False):
                        is_blocked = True
                        block_reason = f"Blocked by dependency: {dep.get('title', 'Unknown')}"
                        break
            
            # Check for status-based blocks
            status = task.get('status', '').lower()
            if status in ['blocked', 'waiting', 'on hold']:
                is_blocked = True
                block_reason = f"Task status is '{task.get('status')}'"
            
            # Check for overdue without progress
            if task.get('due_date'):
                due_date = datetime.fromisoformat(task['due_date'])
                if due_date < datetime.utcnow() and not task.get('completed', False):
                    is_blocked = True
                    block_reason = "Task is overdue and not completed"
            
            if is_blocked:
                blocked_tasks.append({
                    'task_id': task.get('id'),
                    'task_title': task.get('title'),
                    'project_id': task.get('project_id'),
                    'reason': block_reason,
                    'severity': 'high' if 'overdue' in (block_reason or '').lower() else 'medium',
                    'blocked_since': task.get('updated_at', task.get('created_at'))
                })
        
        return blocked_tasks
    
    async def identify_slow_progress(self, projects: List[Dict], tasks: List[Dict]) -> List[Dict]:
        """Identify projects with slow progress"""
        slow_projects = []
        
        for project in projects:
            project_tasks = [t for t in tasks if t.get('project_id') == project.get('id')]
            
            if not project_tasks:
                continue
            
            # Calculate velocity (tasks completed per week)
            completed_tasks = [t for t in project_tasks if t.get('completed', False)]
            
            if len(completed_tasks) > 0:
                # Get time range of completed tasks
                completion_dates = [
                    datetime.fromisoformat(t.get('completed_at') or t.get('updated_at'))
                    for t in completed_tasks
                ]
                
                if completion_dates:
                    time_range = (max(completion_dates) - min(completion_dates)).days
                    if time_range > 0:
                        velocity = len(completed_tasks) / (time_range / 7)  # tasks per week
                        
                        # Slow progress: less than 2 tasks per week for projects with > 10 tasks
                        if len(project_tasks) > 10 and velocity < 2:
                            slow_projects.append({
                                'project_id': project.get('id'),
                                'project_name': project.get('name'),
                                'current_velocity': round(velocity, 2),
                                'total_tasks': len(project_tasks),
                                'completed_tasks': len(completed_tasks),
                                'severity': 'high' if velocity < 1 else 'medium',
                                'recommendation': 'Review team capacity and task complexity'
                            })
        
        return slow_projects
    
    async def analyze_member_workload(self, tasks: List[Dict], users: List[Dict]) -> Dict:
        """Analyze member workload distribution"""
        workload = {}
        
        for user in users:
            user_id = user.get('id')
            user_tasks = [t for t in tasks if t.get('assignee_id') == user_id]
            
            # Calculate workload metrics
            total_tasks = len(user_tasks)
            completed_tasks = len([t for t in user_tasks if t.get('completed', False)])
            in_progress_tasks = len([t for t in user_tasks if not t.get('completed', False)])
            
            # Calculate story points
            total_points = sum(t.get('story_points', 0) for t in user_tasks)
            completed_points = sum(t.get('story_points', 0) for t in user_tasks if t.get('completed', False))
            
            # Calculate overdue tasks
            overdue_tasks = []
            for task in user_tasks:
                if task.get('due_date') and not task.get('completed', False):
                    due_date = datetime.fromisoformat(task['due_date'])
                    if due_date < datetime.utcnow():
                        overdue_tasks.append(task.get('title'))
            
            workload[user_id] = {
                'user_name': user.get('full_name', 'Unknown'),
                'user_email': user.get('email'),
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'in_progress_tasks': in_progress_tasks,
                'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
                'total_story_points': total_points,
                'completed_story_points': completed_points,
                'overdue_tasks': len(overdue_tasks),
                'overdue_task_names': overdue_tasks,
                'workload_level': self._calculate_workload_level(total_tasks, completed_tasks)
            }
        
        return workload
    
    def _calculate_workload_level(self, total_tasks: int, completed_tasks: int) -> str:
        """Calculate workload level based on task distribution"""
        in_progress = total_tasks - completed_tasks
        
        if in_progress > 10:
            return 'high'
        elif in_progress > 5:
            return 'medium'
        else:
            return 'low'
    
    async def predict_sprint_completion(self, sprint: Dict, tasks: List[Dict]) -> Dict:
        """Predict sprint completion based on current progress"""
        sprint_tasks = [t for t in tasks if t.get('sprint_id') == sprint.get('id')]
        
        if not sprint_tasks:
            return {
                'sprint_id': sprint.get('id'),
                'prediction': 'no_data',
                'confidence': 0,
                'estimated_completion_date': None
            }
        
        completed_tasks = [t for t in sprint_tasks if t.get('completed', False)]
        total_points = sum(t.get('story_points', 0) for t in sprint_tasks)
        completed_points = sum(t.get('story_points', 0) for t in completed_tasks)
        
        # Calculate completion rate
        completion_rate = completed_points / total_points if total_points > 0 else 0
        
        # Get sprint duration
        start_date = datetime.fromisoformat(sprint.get('start_date') or sprint.get('created_at'))
        end_date = datetime.fromisoformat(sprint.get('end_date')) if sprint.get('end_date') else None
        duration_days = (end_date - start_date).days if end_date else 14
        
        # Calculate days elapsed
        days_elapsed = (datetime.utcnow() - start_date).days
        days_remaining = duration_days - days_elapsed
        
        # Calculate velocity (points per day)
        if days_elapsed > 0:
            velocity = completed_points / days_elapsed
        else:
            velocity = 0
        
        # Predict completion
        if velocity > 0:
            remaining_points = total_points - completed_points
            estimated_days_to_complete = remaining_points / velocity if velocity > 0 else float('inf')
            
            if estimated_days_to_complete <= days_remaining:
                prediction = 'on_track'
                confidence = min(0.9, completion_rate + 0.3)
            elif estimated_days_to_complete <= days_remaining * 1.5:
                prediction = 'at_risk'
                confidence = 0.6
            else:
                prediction = 'behind_schedule'
                confidence = 0.8
        else:
            prediction = 'no_progress'
            confidence = 0.5
        
        # Calculate estimated completion date
        if velocity > 0:
            remaining_points = total_points - completed_points
            days_needed = remaining_points / velocity
            estimated_completion = start_date + timedelta(days=days_elapsed + days_needed)
        else:
            estimated_completion = None
        
        return {
            'sprint_id': sprint.get('id'),
            'sprint_name': sprint.get('name'),
            'prediction': prediction,
            'confidence': round(confidence, 2),
            'completion_rate': round(completion_rate * 100, 2),
            'velocity': round(velocity, 2),
            'days_remaining': max(0, days_remaining),
            'estimated_completion_date': estimated_completion.isoformat() if estimated_completion else None,
            'recommendations': self._get_sprint_recommendations(prediction, completion_rate, days_remaining)
        }
    
    def _get_sprint_recommendations(self, prediction: str, completion_rate: float, days_remaining: int) -> List[str]:
        """Get recommendations based on prediction"""
        recommendations = []
        
        if prediction == 'behind_schedule':
            recommendations.append('Consider reducing sprint scope')
            recommendations.append('Add additional resources if possible')
            recommendations.append('Focus on high-priority items only')
        elif prediction == 'at_risk':
            recommendations.append('Monitor daily progress closely')
            recommendations.append('Prepare contingency plans')
            recommendations.append('Review task dependencies')
        elif prediction == 'no_progress':
            recommendations.append('Investigate blockers immediately')
            recommendations.append('Ensure team has clear priorities')
            recommendations.append('Review sprint goal alignment')
        
        if days_remaining < 3 and completion_rate < 50:
            recommendations.append('Critical: Sprint completion unlikely without intervention')
        
        return recommendations
    
    async def forecast_completion(self, projects: List[Dict], tasks: List[Dict]) -> Dict:
        """Forecast project completion dates"""
        forecasts = {}
        
        for project in projects:
            project_tasks = [t for t in tasks if t.get('project_id') == project.get('id')]
            
            if not project_tasks:
                continue
            
            completed_tasks = [t for t in project_tasks if t.get('completed', False)]
            total_points = sum(t.get('story_points', 0) for t in project_tasks)
            completed_points = sum(t.get('story_points', 0) for t in completed_tasks)
            
            # Calculate project velocity
            if len(completed_tasks) > 1:
                completion_dates = [
                    datetime.fromisoformat(t.get('completed_at') or t.get('updated_at'))
                    for t in completed_tasks
                ]
                time_range = (max(completion_dates) - min(completion_dates)).days
                
                if time_range > 0:
                    velocity = completed_points / (time_range / 7)  # points per week
                else:
                    velocity = 0
            else:
                velocity = 0
            
            # Calculate remaining work
            remaining_points = total_points - completed_points
            
            # Forecast completion
            if velocity > 0 and remaining_points > 0:
                weeks_needed = remaining_points / velocity
                estimated_completion = datetime.utcnow() + timedelta(weeks=weeks_needed)
                
                # Check if project has due date
                due_date = project.get('due_date')
                if due_date:
                    due_dt = datetime.fromisoformat(due_date)
                    is_on_track = estimated_completion <= due_dt
                    days_diff = (due_dt - datetime.utcnow()).days
                else:
                    is_on_track = True
                    days_diff = None
                
                forecasts[project.get('id')] = {
                    'project_name': project.get('name'),
                    'current_progress': round((completed_points / total_points * 100) if total_points > 0 else 0, 2),
                    'velocity': round(velocity, 2),
                    'remaining_points': remaining_points,
                    'estimated_completion_date': estimated_completion.isoformat(),
                    'is_on_track': is_on_track,
                    'days_ahead_or_behind': round(days_diff) if days_diff else None,
                    'confidence': 0.7 if velocity > 0 else 0.3
                }
            else:
                forecasts[project.get('id')] = {
                    'project_name': project.get('name'),
                    'current_progress': round((completed_points / total_points * 100) if total_points > 0 else 0, 2),
                    'velocity': 0,
                    'remaining_points': remaining_points,
                    'estimated_completion_date': None,
                    'is_on_track': None,
                    'days_ahead_or_behind': None,
                    'confidence': 0.2
                }
        
        return forecasts


class WorkspaceInsightsService:
    """Main service for workspace insights"""
    
    def __init__(self, provider: Optional[InsightsProvider] = None):
        self.provider = provider or DynamicInsightsProvider()
    
    async def get_project_risks(self, projects: List[Dict]) -> List[Dict]:
        return await self.provider.analyze_project_risks(projects)
    
    async def get_blocked_tasks(self, tasks: List[Dict]) -> List[Dict]:
        return await self.provider.identify_blocked_tasks(tasks)
    
    async def get_slow_progress(self, projects: List[Dict], tasks: List[Dict]) -> List[Dict]:
        return await self.provider.identify_slow_progress(projects, tasks)
    
    async def get_member_workload(self, tasks: List[Dict], users: List[Dict]) -> Dict:
        return await self.provider.analyze_member_workload(tasks, users)
    
    async def get_sprint_prediction(self, sprint: Dict, tasks: List[Dict]) -> Dict:
        return await self.provider.predict_sprint_completion(sprint, tasks)
    
    async def get_completion_forecast(self, projects: List[Dict], tasks: List[Dict]) -> Dict:
        return await self.provider.forecast_completion(projects, tasks)
    
    async def get_all_insights(self, projects: List[Dict], tasks: List[Dict], sprints: List[Dict], users: List[Dict]) -> Dict:
        """Get comprehensive workspace insights"""
        return {
            'project_risks': await self.get_project_risks(projects),
            'blocked_tasks': await self.get_blocked_tasks(tasks),
            'slow_progress': await self.get_slow_progress(projects, tasks),
            'member_workload': await self.get_member_workload(tasks, users),
            'sprint_predictions': [await self.get_sprint_prediction(sprint, tasks) for sprint in sprints],
            'completion_forecasts': await self.get_completion_forecast(projects, tasks),
            'generated_at': datetime.utcnow().isoformat()
        }


# Singleton instance
workspace_insights = WorkspaceInsightsService()
