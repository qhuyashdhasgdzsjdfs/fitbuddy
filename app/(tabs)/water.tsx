// app/(tabs)/water.tsx
// ✅ Self-contained: không import waterService hay reminderService

import { useGoals } from "@/hooks/useGoals";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  collection, doc, getDocs, getFirestore, query, setDoc, where,
} from "firebase/firestore";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert, Animated, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
} from "react-native";

// ─── Constants / Helpers ──────────────────────────────────────────────────────

const ML_PER_GLASS = 250;
const REMINDER_KEY = "water_reminder_on";

function uid()   { try { return getAuth(getApp()).currentUser?.uid ?? "guest"; } catch { return "guest"; } }
function getDb() { return getFirestore(getApp()); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function dayLbl(d: string) { return ["CN","T2","T3","T4","T5","T6","T7"][new Date(d+"T00:00:00").getDay()]; }

// ─── Firestore ────────────────────────────────────────────────────────────────

interface WaterLog { userId:string; date:string; glasses:number; ml:number; updatedAt:number; }

async function saveWater(userId:string, glasses:number) {
  await setDoc(doc(getDb(),"water_logs",`${userId}_${todayStr()}`),
    { userId, date:todayStr(), glasses, ml:glasses*ML_PER_GLASS, updatedAt:Date.now() });
}

async function loadToday(userId:string): Promise<number> {
  const snap = await getDocs(query(collection(getDb(),"water_logs"), where("userId","==",userId)));
  return snap.docs.map(d=>d.data() as WaterLog).find(e=>e.date===todayStr())?.glasses ?? 0;
}

async function loadWeek(userId:string): Promise<WaterLog[]> {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-6);
  const cutoffDate = cutoff.toISOString().split("T")[0];
  const snap = await getDocs(query(collection(getDb(),"water_logs"), where("userId","==",userId)));
  const map: Record<string,WaterLog> = {};
  snap.docs.map(d=>d.data() as WaterLog).filter(e=>e.date>=cutoffDate).forEach(e=>{map[e.date]=e;});
  return Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-(6-i));
    const ds=d.toISOString().split("T")[0];
    return map[ds] ?? {userId,date:ds,glasses:0,ml:0,updatedAt:0};
  });
}

// ─── Bottle ───────────────────────────────────────────────────────────────────

function Bottle({ glasses, goal }: { glasses:number; goal:number }) {
  const pct  = Math.min(glasses/goal,1);
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(()=>{
    Animated.spring(anim,{toValue:pct,useNativeDriver:false,tension:40,friction:8}).start();
  },[glasses,goal]);
  const color = pct>=1?"#22C55E":pct>=0.5?"#38bdf8":"#93C5FD";
  return (
    <View style={bt.wrap}>
      <View style={bt.bottle}>
        <Animated.View style={[bt.fill,{
          height: anim.interpolate({inputRange:[0,1],outputRange:["0%","100%"]}),
          backgroundColor: color,
        }]}/>
        {Array.from({length:goal-1}).map((_,i)=>(
          <View key={i} style={[bt.mark,{bottom:`${((i+1)/goal)*100}%`}]}/>
        ))}
      </View>
      <View style={bt.info}>
        <Text style={[bt.num,{color}]}>{glasses}</Text>
        <Text style={bt.of}>/ {goal} ly</Text>
        <Text style={[bt.ml,{color}]}>{glasses*ML_PER_GLASS} ml</Text>
      </View>
    </View>
  );
}
const bt = StyleSheet.create({
  wrap:   {alignItems:"center",marginVertical:8},
  bottle: {width:90,height:180,borderRadius:20,borderWidth:3,borderColor:"#BAE6FD",backgroundColor:"#EFF6FF",overflow:"hidden",position:"relative"},
  fill:   {width:"100%",position:"absolute",bottom:0,borderRadius:17},
  mark:   {position:"absolute",width:"100%",height:1.5,backgroundColor:"rgba(255,255,255,0.5)"},
  info:   {position:"absolute",alignItems:"center"},
  num:    {fontSize:34,fontWeight:"900"},
  of:     {fontSize:13,color:"#6B7280"},
  ml:     {fontSize:12,fontWeight:"700",marginTop:2},
});

// ─── Chart ────────────────────────────────────────────────────────────────────

function Chart({ data, goal }: { data:WaterLog[]; goal:number }) {
  const today = todayStr();
  return (
    <View style={ch.card}>
      <Text style={ch.title}>📅 7 ngày gần nhất</Text>
      <View style={ch.bars}>
        {data.map(item=>{
          const pct=Math.min(item.glasses/goal,1), isToday=item.date===today;
          return (
            <View key={item.date} style={ch.col}>
              <Text style={ch.val}>{item.glasses>0?item.glasses:""}</Text>
              <View style={ch.bg}>
                <View style={[ch.fill,{height:`${Math.max(pct*100,4)}%`,backgroundColor:isToday?"#38bdf8":"#BAE6FD"}]}/>
              </View>
              <Text style={[ch.day,isToday&&{color:"#38bdf8",fontWeight:"700"}]}>{dayLbl(item.date)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
const ch = StyleSheet.create({
  card:  {backgroundColor:"#fff",borderRadius:16,padding:16,borderWidth:1,borderColor:"#E0F2FE"},
  title: {fontSize:14,fontWeight:"700",color:"#0C4A6E",marginBottom:14},
  bars:  {flexDirection:"row",alignItems:"flex-end",gap:6,height:90},
  col:   {flex:1,alignItems:"center",height:"100%"},
  val:   {fontSize:9,color:"#6B7280",marginBottom:2},
  bg:    {flex:1,width:"100%",backgroundColor:"#F3F4F6",borderRadius:6,justifyContent:"flex-end",overflow:"hidden"},
  fill:  {width:"100%",borderRadius:6},
  day:   {fontSize:10,color:"#9CA3AF",marginTop:4},
});

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WaterScreen() {
  const userId     = uid();
  const { goals }  = useGoals();
  const GOAL       = goals.waterGlasses;
  const GOAL_ML    = GOAL * ML_PER_GLASS;

  const [glasses,    setGlasses]    = useState(0);
  const [history,    setHistory]    = useState<WaterLog[]>([]);
  const [reminderOn, setReminderOn] = useState(false);

  useFocusEffect(useCallback(()=>{
    (async()=>{
      try {
        const [g,week,rem] = await Promise.all([loadToday(userId),loadWeek(userId),AsyncStorage.getItem(REMINDER_KEY)]);
        setGlasses(g); setHistory(week); setReminderOn(rem==="1");
      } catch(e){console.error("Water:",e);}
    })();
  },[userId]));

  async function add(n:number) {
    const next=Math.max(0,glasses+n);
    setGlasses(next);
    setHistory(prev=>prev.map(h=>h.date===todayStr()?{...h,glasses:next,ml:next*ML_PER_GLASS}:h));
    await saveWater(userId,next).catch(console.error);
    if(next>=GOAL && glasses<GOAL) Alert.alert("🎉 Xuất sắc!","Bạn đã uống đủ nước hôm nay!");
  }

  const pct   = Math.min(glasses/GOAL,1);
  const color = pct>=1?"#22C55E":pct>=0.5?"#38bdf8":"#60A5FA";

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      <View style={s.header}>
        <Text style={s.title}>💧 Uống nước</Text>
        <Text style={s.subtitle}>Mục tiêu {GOAL_ML} ml · {GOAL} ly / ngày</Text>
      </View>

      {/* Progress card */}
      <View style={s.card}>
        <Bottle glasses={glasses} goal={GOAL}/>
        <View style={s.barBg}>
          <View style={[s.barFill,{width:`${pct*100}%`,backgroundColor:color}]}/>
        </View>
        <Text style={[s.pctText,{color}]}>
          {pct>=1?"✅ Đã đạt mục tiêu!":`Còn ${GOAL-glasses} ly nữa (${(GOAL-glasses)*ML_PER_GLASS} ml)`}
        </Text>
      </View>

      {/* Add buttons */}
      <Text style={s.sectionTitle}>Thêm nhanh</Text>
      <View style={s.addRow}>
        {([{label:"+1 ly",n:1,color:"#38bdf8"},{label:"+2 ly",n:2,color:"#3B82F6"},{label:"−1 ly",n:-1,color:"#EF4444"}] as const).map(btn=>(
          <TouchableOpacity key={btn.label} style={[s.addBtn,{borderColor:btn.color+"40",backgroundColor:btn.color+"12"}]} onPress={()=>add(btn.n)}>
            <Ionicons name={btn.n>0?"add-circle-outline":"remove-circle-outline"} size={22} color={btn.color}/>
            <Text style={[s.addBtnText,{color:btn.color}]}>{btn.label}</Text>
            <Text style={[s.addBtnSub,{color:btn.color+"99"}]}>{btn.n>0?`${btn.n*ML_PER_GLASS}ml`:""}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        {[
          {num:String(glasses),       label:"Ly uống",    color:"#38bdf8"},
          {num:`${glasses*ML_PER_GLASS}`,label:"ml",      color:"#3B82F6"},
          {num:`${Math.round(pct*100)}%`,label:"Tiến độ", color},
        ].map((st,i)=>(
          <View key={i} style={s.statBox}>
            <Text style={[s.statNum,{color:st.color}]}>{st.num}</Text>
            <Text style={s.statLabel}>{st.label}</Text>
          </View>
        ))}
      </View>

      {/* Reminder */}
      <View style={s.reminderCard}>
        <View style={s.reminderLeft}>
          <View style={s.reminderIcon}><Ionicons name="notifications-outline" size={20} color="#38bdf8"/></View>
          <View>
            <Text style={s.reminderTitle}>Nhắc nhở uống nước</Text>
            <Text style={s.reminderSub}>{reminderOn?"Mỗi 2 giờ · Đang bật":"Đang tắt"}</Text>
          </View>
        </View>
        <Switch value={reminderOn} onValueChange={async v=>{setReminderOn(v);await AsyncStorage.setItem(REMINDER_KEY,v?"1":"0");}} trackColor={{false:"#E5E7EB",true:"#BAE6FD"}} thumbColor={reminderOn?"#38bdf8":"#9CA3AF"}/>
      </View>

      {/* Reset */}
      <TouchableOpacity style={s.resetBtn} onPress={()=>Alert.alert("Đặt lại?","Xóa dữ liệu nước hôm nay?",[{text:"Hủy",style:"cancel"},{text:"Đặt lại",style:"destructive",onPress:async()=>{setGlasses(0);await saveWater(userId,0);}}])}>
        <Ionicons name="refresh-outline" size={16} color="#EF4444"/>
        <Text style={s.resetText}>Đặt lại hôm nay</Text>
      </TouchableOpacity>

      {/* Chart */}
      {history.length>0 && <Chart data={history} goal={GOAL}/>}

      {/* Tips */}
      <View style={s.tipCard}>
        <Text style={s.tipTitle}>💡 Mẹo uống nước</Text>
        {["Uống 1 ly ngay sau khi thức dậy","Uống trước bữa ăn 30 phút","Mang theo bình nước bên người","Uống thêm 500ml khi tập thể dục"].map((t,i)=>(
          <Text key={i} style={s.tipText}>• {t}</Text>
        ))}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:        {flex:1,backgroundColor:"#F0F9FF"},
  content:       {paddingHorizontal:20,paddingTop:60,paddingBottom:40},
  header:        {marginBottom:20},
  title:         {fontSize:28,fontWeight:"900",color:"#0C4A6E"},
  subtitle:      {fontSize:13,color:"#0369A1",marginTop:3},
  card:          {backgroundColor:"#fff",borderRadius:24,padding:20,alignItems:"center",marginBottom:20,elevation:3,shadowColor:"#38bdf8",shadowOffset:{width:0,height:2},shadowOpacity:0.12,shadowRadius:12},
  barBg:         {width:"100%",height:8,backgroundColor:"#E0F2FE",borderRadius:8,marginTop:16,overflow:"hidden"},
  barFill:       {height:"100%",borderRadius:8},
  pctText:       {fontSize:13,marginTop:10,fontWeight:"600"},
  sectionTitle:  {fontSize:15,fontWeight:"700",color:"#0C4A6E",marginBottom:10},
  addRow:        {flexDirection:"row",gap:10,marginBottom:16},
  addBtn:        {flex:1,alignItems:"center",paddingVertical:14,borderRadius:14,borderWidth:1.5,gap:3},
  addBtnText:    {fontSize:13,fontWeight:"800"},
  addBtnSub:     {fontSize:10},
  statsRow:      {flexDirection:"row",gap:10,marginBottom:16},
  statBox:       {flex:1,backgroundColor:"#fff",borderRadius:14,padding:14,alignItems:"center",borderWidth:1,borderColor:"#BAE6FD"},
  statNum:       {fontSize:20,fontWeight:"800"},
  statLabel:     {fontSize:11,color:"#6B7280",marginTop:2},
  reminderCard:  {flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:"#fff",borderRadius:16,padding:16,marginBottom:12,borderWidth:1,borderColor:"#BAE6FD"},
  reminderLeft:  {flexDirection:"row",alignItems:"center",gap:12},
  reminderIcon:  {width:40,height:40,borderRadius:12,backgroundColor:"#EFF6FF",justifyContent:"center",alignItems:"center"},
  reminderTitle: {fontSize:14,fontWeight:"700",color:"#0C4A6E"},
  reminderSub:   {fontSize:12,color:"#0369A1",marginTop:2},
  resetBtn:      {flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,paddingVertical:13,borderRadius:14,borderWidth:1.5,borderColor:"#FECACA",backgroundColor:"#FFF1F2",marginBottom:16},
  resetText:     {color:"#EF4444",fontWeight:"700",fontSize:14},
  tipCard:       {backgroundColor:"#E0F2FE",borderRadius:16,padding:16,marginTop:8,borderWidth:1,borderColor:"#BAE6FD"},
  tipTitle:      {fontSize:13,fontWeight:"700",color:"#0369A1",marginBottom:8},
  tipText:       {fontSize:12,color:"#0C4A6E",lineHeight:22},
});