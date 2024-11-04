class PseudoFileHandler:
    def __init__(self):
        self.abstraction_levels = []
    
    def parse_file_content(self, content):
        """
        Parse the .pseudo file content and extract abstraction levels
        """
        try:
            lines = content.split('\n')
            parsed_content = {
                'raw_content': content,
                'abstraction_levels': self._extract_abstraction_levels(lines),
                'sections': self._parse_sections(lines)
            }
            return parsed_content
        except Exception as e:
            raise Exception(f"Failed to parse pseudo file: {str(e)}")
    
    def _extract_abstraction_levels(self, lines):
        """
        Extract abstraction level markers from the content
        """
        levels = set()
        for line in lines:
            if line.strip().startswith('@level:'):
                level = line.strip().split('@level:')[1].strip()
                levels.add(level)
        return sorted(list(levels))
    
    def _parse_sections(self, lines):
        """
        Parse the content into sections based on abstraction levels
        """
        sections = []
        current_section = {'level': 'default', 'content': []}
        
        for line in lines:
            if line.strip().startswith('@level:'):
                if current_section['content']:
                    sections.append(current_section)
                level = line.strip().split('@level:')[1].strip()
                current_section = {'level': level, 'content': []}
            else:
                current_section['content'].append(line)
        
        if current_section['content']:
            sections.append(current_section)
            
        return sections 