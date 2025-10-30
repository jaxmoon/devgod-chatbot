#!/bin/bash
# Logger Utility for Agent Swarm Execution
# 에이전트 실행 로그를 관리하는 유틸리티

# 색상 정의
export COLOR_RESET='\033[0m'
export COLOR_RED='\033[0;31m'
export COLOR_GREEN='\033[0;32m'
export COLOR_YELLOW='\033[1;33m'
export COLOR_BLUE='\033[0;34m'
export COLOR_MAGENTA='\033[0;35m'
export COLOR_CYAN='\033[0;36m'
export COLOR_WHITE='\033[1;37m'

# 로그 파일 경로
export LOG_FILE="docs/tasks/execution.log"
export REPORT_FILE="docs/tasks/execution-report.json"

# 로그 디렉토리 생성
mkdir -p "$(dirname "$LOG_FILE")"

# 로그 초기화
init_log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "=========================================" | tee "$LOG_FILE"
    echo "  Agent Swarm Execution Log" | tee -a "$LOG_FILE"
    echo "  Started at: $timestamp" | tee -a "$LOG_FILE"
    echo "=========================================" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# 로그 메시지 기록
log_message() {
    local level="$1"
    local agent_id="$2"
    local message="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # 레벨별 색상 설정
    local color=""
    case "$level" in
        "INFO")
            color="$COLOR_BLUE"
            ;;
        "SUCCESS")
            color="$COLOR_GREEN"
            ;;
        "WARNING")
            color="$COLOR_YELLOW"
            ;;
        "ERROR")
            color="$COLOR_RED"
            ;;
        "PHASE")
            color="$COLOR_MAGENTA"
            ;;
        *)
            color="$COLOR_WHITE"
            ;;
    esac

    # 콘솔 출력 (색상)
    echo -e "${color}[$timestamp] [$level] [AGENT_$agent_id] $message${COLOR_RESET}"

    # 파일 출력 (색상 없음)
    echo "[$timestamp] [$level] [AGENT_$agent_id] $message" >> "$LOG_FILE"
}

# Phase 시작 로그
log_phase_start() {
    local phase_num="$1"
    local phase_name="$2"
    local is_parallel="$3"

    echo "" | tee -a "$LOG_FILE"
    echo -e "${COLOR_MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}" | tee -a "$LOG_FILE"

    if [ "$is_parallel" = "true" ]; then
        echo -e "${COLOR_MAGENTA}Phase $phase_num: $phase_name (병렬 실행)${COLOR_RESET}" | tee -a "$LOG_FILE"
    else
        echo -e "${COLOR_MAGENTA}Phase $phase_num: $phase_name (순차 실행)${COLOR_RESET}" | tee -a "$LOG_FILE"
    fi

    echo -e "${COLOR_MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Phase 종료 로그
log_phase_end() {
    local phase_num="$1"
    local status="$2"  # "success" or "failed"
    local duration="$3"

    echo "" | tee -a "$LOG_FILE"

    if [ "$status" = "success" ]; then
        echo -e "${COLOR_GREEN}✅ Phase $phase_num 완료 (소요시간: ${duration}초)${COLOR_RESET}" | tee -a "$LOG_FILE"
    else
        echo -e "${COLOR_RED}❌ Phase $phase_num 실패 (소요시간: ${duration}초)${COLOR_RESET}" | tee -a "$LOG_FILE"
    fi

    echo "" | tee -a "$LOG_FILE"
}

# Agent 시작 로그
log_agent_start() {
    local agent_id="$1"
    local task_name="$2"

    echo -e "${COLOR_CYAN}▶ AGENT_$agent_id 시작: $task_name${COLOR_RESET}" | tee -a "$LOG_FILE"
}

# Agent 완료 로그
log_agent_complete() {
    local agent_id="$1"
    local duration="$2"

    echo -e "${COLOR_GREEN}✓ AGENT_$agent_id 완료 (${duration}초)${COLOR_RESET}" | tee -a "$LOG_FILE"
}

# Agent 실패 로그
log_agent_failed() {
    local agent_id="$1"
    local error_msg="$2"

    echo -e "${COLOR_RED}✗ AGENT_$agent_id 실패: $error_msg${COLOR_RESET}" | tee -a "$LOG_FILE"
}

# 진행 상황 표시
log_progress() {
    local current="$1"
    local total="$2"
    local percentage=$((current * 100 / total))

    local bar_length=50
    local filled_length=$((percentage * bar_length / 100))
    local bar=""

    for ((i=0; i<filled_length; i++)); do
        bar="${bar}█"
    done

    for ((i=filled_length; i<bar_length; i++)); do
        bar="${bar}░"
    done

    echo -e "${COLOR_CYAN}진행률: [${bar}] ${percentage}% (${current}/${total})${COLOR_RESET}" | tee -a "$LOG_FILE"
}

# 최종 리포트 생성
generate_report() {
    local total_phases="$1"
    local completed_phases="$2"
    local failed_phases="$3"
    local total_duration="$4"
    local estimated_duration="$5"

    local time_saved=$((estimated_duration - total_duration))
    local savings_percent=0

    if [ "$estimated_duration" -gt 0 ]; then
        savings_percent=$((time_saved * 100 / estimated_duration))
    fi

    # JSON 리포트 생성
    cat > "$REPORT_FILE" <<EOF
{
  "execution_summary": {
    "timestamp": "$(date '+%Y-%m-%d %H:%M:%S')",
    "total_phases": $total_phases,
    "completed_phases": $completed_phases,
    "failed_phases": $failed_phases,
    "success_rate": $((completed_phases * 100 / total_phases))
  },
  "performance": {
    "total_duration_seconds": $total_duration,
    "estimated_duration_seconds": $estimated_duration,
    "time_saved_seconds": $time_saved,
    "savings_percent": $savings_percent
  },
  "log_file": "$LOG_FILE"
}
EOF

    # 콘솔 출력
    echo "" | tee -a "$LOG_FILE"
    echo -e "${COLOR_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_CYAN}실행 리포트${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo -e "${COLOR_WHITE}전체 Phase: $total_phases${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_GREEN}완료: $completed_phases${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_RED}실패: $failed_phases${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_YELLOW}성공률: $((completed_phases * 100 / total_phases))%${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo -e "${COLOR_WHITE}실제 소요 시간: ${total_duration}초${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_WHITE}예상 소요 시간: ${estimated_duration}초${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_GREEN}절감 시간: ${time_saved}초 (${savings_percent}%)${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo -e "${COLOR_CYAN}상세 로그: $LOG_FILE${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_CYAN}JSON 리포트: $REPORT_FILE${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLOR_RESET}" | tee -a "$LOG_FILE"
}

# 경고 메시지
log_warning() {
    local agent_id="$1"
    local message="$2"
    log_message "WARNING" "$agent_id" "$message"
}

# 에러 메시지
log_error() {
    local agent_id="$1"
    local message="$2"
    log_message "ERROR" "$agent_id" "$message"
}

# 정보 메시지
log_info() {
    local agent_id="$1"
    local message="$2"
    log_message "INFO" "$agent_id" "$message"
}

# 성공 메시지
log_success() {
    local agent_id="$1"
    local message="$2"
    log_message "SUCCESS" "$agent_id" "$message"
}
