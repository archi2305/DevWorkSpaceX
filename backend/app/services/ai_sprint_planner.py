"""
AI Sprint Planner Service

Clean architecture for AI-powered sprint planning with OpenAI compatibility.
This service provides intelligent analysis and suggestions for sprint planning.
"""

from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
import json
import uuid
from datetime import datetime

# Abstract base class for AI providers (future OpenAI compatibility)
class AIProvider(ABC):
    @abstractmethod
    async def analyze_backlog(self, tasks: List[Dict]) -> Dict:
        pass

    @abstractmethod
    async def generate_sprint(self, backlog: List[Dict], capacity: int) -> Dict:
        pass

    @abstractmethod
    async def estimate_story_points(self, task: Dict) -> int:
        pass

    @abstractmethod
    async def suggest_priority(self, task: Dict, context: Dict) -> str:
        pass

    @abstractmethod
    async def identify_risks(self, tasks: List[Dict]) -> List[Dict]:
        pass

    @abstractmethod
    async def generate_sprint_goal(self, tasks: List[Dict]) -> str:
        pass


# Mock AI Provider (can be replaced with OpenAI implementation)
class MockAIProvider(AIProvider):
    """Mock implementation for development and testing"""
    
    async def analyze_backlog(self, tasks: List[Dict]) -> Dict:
        """Analyze backlog and provide insights"""
        total_tasks = len(tasks)
        completed = len([t for t in tasks if t.get('completed', False)])
        pending = total_tasks - completed
        
        # Calculate priority distribution
        priorities = [t.get('priority', 'Medium') for t in tasks]
        priority_dist = {
            'High': priorities.count('High'),
            'Medium': priorities.count('Medium'),
            'Low': priorities.count('Low')
        }
        
        # Calculate complexity based on descriptions
        avg_complexity = sum(len(t.get('description', '')) for t in tasks) / max(total_tasks, 1)
        
        return {
            'total_tasks': total_tasks,
            'completed_tasks': completed,
            'pending_tasks': pending,
            'priority_distribution': priority_dist,
            'average_complexity': avg_complexity,
            'completion_rate': (completed / total_tasks * 100) if total_tasks > 0 else 0,
            'recommendations': [
                "Focus on high-priority tasks first",
                "Consider breaking down complex tasks",
                "Review overdue tasks"
            ]
        }
    
    async def generate_sprint(self, backlog: List[Dict], capacity: int = 8) -> Dict:
        """Generate a sprint plan from backlog"""
        # Sort by priority and complexity
        prioritized = sorted(
            backlog,
            key=lambda x: (
                0 if x.get('priority') == 'High' else 1 if x.get('priority') == 'Medium' else 2,
                len(x.get('description', ''))
            )
        )
        
        # Select tasks based on capacity
        selected_tasks = prioritized[:capacity]
        
        # Calculate total story points
        total_points = sum(t.get('story_points', 3) for t in selected_tasks)
        
        # Generate sprint goal
        goal = await self.generate_sprint_goal(selected_tasks)
        
        return {
            'sprint_id': str(uuid.uuid4()),
            'tasks': selected_tasks,
            'total_story_points': total_points,
            'capacity': capacity,
            'sprint_goal': goal,
            'estimated_duration': 2,  # weeks
            'risks': await self.identify_risks(selected_tasks)
        }
    
    async def estimate_story_points(self, task: Dict) -> int:
        """Estimate story points for a task"""
        description = task.get('description', '')
        title = task.get('title', '')
        
        # Simple heuristic based on text length and complexity
        text_length = len(description) + len(title)
        
        if text_length < 50:
            return 1
        elif text_length < 100:
            return 2
        elif text_length < 200:
            return 3
        elif text_length < 400:
            return 5
        else:
            return 8
    
    async def suggest_priority(self, task: Dict, context: Dict) -> str:
        """Suggest priority for a task based on context"""
        # Check for urgency indicators
        title = task.get('title', '').lower()
        description = task.get('description', '').lower()
        
        urgency_keywords = ['urgent', 'critical', 'asap', 'emergency', 'blocker']
        high_priority_keywords = ['important', 'priority', 'key', 'main']
        
        if any(keyword in title or keyword in description for keyword in urgency_keywords):
            return 'High'
        elif any(keyword in title or keyword in description for keyword in high_priority_keywords):
            return 'Medium'
        else:
            return 'Low'
    
    async def identify_risks(self, tasks: List[Dict]) -> List[Dict]:
        """Identify potential risks in the sprint"""
        risks = []
        
        # Check for task complexity risks
        for task in tasks:
            if len(task.get('description', '')) > 500:
                risks.append({
                    'type': 'complexity',
                    'severity': 'medium',
                    'description': f"Task '{task.get('title')}' has high complexity",
                    'task_id': task.get('id')
                })
        
        # Check for dependency risks
        high_priority_count = sum(1 for t in tasks if t.get('priority') == 'High')
        if high_priority_count > len(tasks) * 0.5:
            risks.append({
                'type': 'capacity',
                'severity': 'high',
                'description': 'Too many high-priority tasks may impact sprint completion',
                'task_id': None
            })
        
        # Check for story point risks
        total_points = sum(t.get('story_points', 3) for t in tasks)
        if total_points > 40:  # Typical sprint capacity
            risks.append({
                'type': 'capacity',
                'severity': 'high',
                'description': f'Total story points ({total_points}) exceed typical sprint capacity',
                'task_id': None
            })
        
        return risks
    
    async def generate_sprint_goal(self, tasks: List[Dict]) -> str:
        """Generate a sprint goal based on selected tasks"""
        if not tasks:
            return "Complete pending tasks and improve overall project progress"
        
        # Analyze task themes
        task_titles = [t.get('title', '') for t in tasks]
        common_words = []
        
        for title in task_titles:
            words = title.lower().split()
            common_words.extend(words)
        
        # Find most common themes
        from collections import Counter
        word_counts = Counter(common_words)
        top_themes = [word for word, count in word_counts.most_common(3) if len(word) > 3]
        
        if top_themes:
            themes = ', '.join(top_themes)
            return f"Deliver key features focusing on {themes} to improve product capabilities"
        else:
            return "Complete prioritized backlog items to drive project forward"


class AISprintPlannerService:
    """Main service for AI-powered sprint planning"""
    
    def __init__(self, ai_provider: Optional[AIProvider] = None):
        self.ai_provider = ai_provider or MockAIProvider()
    
    async def analyze_backlog(self, tasks: List[Dict]) -> Dict:
        """Analyze the current backlog"""
        return await self.ai_provider.analyze_backlog(tasks)
    
    async def generate_sprint(self, backlog: List[Dict], capacity: int = 8) -> Dict:
        """Generate a complete sprint plan"""
        return await self.ai_provider.generate_sprint(backlog, capacity)
    
    async def estimate_story_points(self, task: Dict) -> int:
        """Get AI-estimated story points for a task"""
        return await self.ai_provider.estimate_story_points(task)
    
    async def suggest_priority(self, task: Dict, context: Dict) -> str:
        """Get AI-suggested priority for a task"""
        return await self.ai_provider.suggest_priority(task, context)
    
    async def identify_risks(self, tasks: List[Dict]) -> List[Dict]:
        """Identify potential risks in the sprint"""
        return await self.ai_provider.identify_risks(tasks)
    
    async def generate_sprint_goal(self, tasks: List[Dict]) -> str:
        """Generate an AI-powered sprint goal"""
        return await self.ai_provider.generate_sprint_goal(tasks)


# Singleton instance
ai_sprint_planner = AISprintPlannerService()
